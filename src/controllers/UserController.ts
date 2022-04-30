import { Request, Response } from "express";
import { getRepository,getManager } from "typeorm";
import { validate } from "class-validator";
import { decode,JwtPayload } from "jsonwebtoken";

import { User } from "../entity/User";

class UserController{

  static getStatus = async (req: Request, res: Response) => {
    //Get status
    res.send("Running");
  };
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
static listAll = async (req: Request, res: Response) => {
  //Get users from database
  const userRepository = getRepository(User);
  const users = await userRepository.find({
    select: ["id", "name", "role"] //We dont want to send the passwords on response
  });

  //Send the users object
  res.send(users);
};

static getOneById = async (req: Request, res: Response) => {
  //Get the ID from the url
  const id: number = req.params.id;

  //Get the user from database
  const userRepository = getRepository(User);
  try {
    const user = await userRepository.findOneOrFail(id, {
      select: ["id", "name", "role"] //We dont want to send the password on response
    });
  } catch (error) {
    res.status(404).send("User not found");
  }
};

static newUser = async (req: Request, res: Response) => {
  //Get parameters from the body
  let { name, email, password, role } = req.body;
  let user = new User();
  user.name = name;
  user.email = email;
  user.password = password;
  user.role = role;
  user.register_timestamp = Date.now().toString();
  user.login_timestamp = Date.now().toString();

  //Validade if the parameters are ok
  const errors = await validate(user);
  if (errors.length > 0) {
    res.status(400).send(errors);
    return;
  }

  //Hash the password, to securely store on DB
  user.hashPassword();

  //Try to save. If fails, the username is already in use
  const userRepository = getRepository(User);
  try {
    await userRepository.save(user);
  } catch (e) {
    res.status(409).send("username already in use");
    return;
  }

  //If all ok, send 201 response
  res.status(201).send("User created");
};

static editUser = async (req: Request, res: Response) => {
  //Get the ID from the url
  const id = req.params.id;

  //Get values from the body
  const { name, role } = req.body;

  //Try to find user on database
  const userRepository = getRepository(User);
  let user;
  try {
    user = await userRepository.findOneOrFail(id);
  } catch (error) {
    //If not found, send a 404 response
    res.status(404).send("User not found");
    return;
  }

  //Validate the new values on model
  user.name = name;
  user.role = role;
  const errors = await validate(user);
  if (errors.length > 0) {
    res.status(400).send(errors);
    return;
  }

  //Try to safe, if fails, that means username already in use
  try {
    await userRepository.save(user);
  } catch (e) {
    res.status(409).send("username already in use");
    return;
  }
  //After all send a 204 (no content, but accepted) response
  res.status(204).send();
};

static deleteUser = async (req: Request, res: Response) => {
  //Get the ID from the url
  const id = req.params.id;

  const userRepository = getRepository(User);
  let user: User;
  try {
    user = await userRepository.findOneOrFail(id);
  } catch (error) {
    res.status(404).send("User not found");
    return;
  }
  userRepository.delete(id);

  //After all send a 204 (no content, but accepted) response
  res.status(204).send();
};
};

export default UserController;