const express = require("express");
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
// import the instance that is exported with a default json filename
const usersRepo = require("./repositories/users");
console.log(usersRepo);
const app = express();

app.listen(3000, () => {
  console.log("Listening");
});
// wire up the bodyParser middleware for global use in app
app.use(bodyParser.urlencoded({ extended: true }));
// wire up cookie middleware handler by passing in random string used in encryption of (user) data in cookie
// changing the key while on production would turn existing sessions / cookies unusable
// req.session object gets added to the request data
app.use(cookieSession({ keys: ["adj2302344509askt20"] }));

// manual middleware parser with very limited functionality. not your prod code
/*
const bodyParser = (req, res, next) => {
  if (req.method === "POST") {
    req.on("data", (data) => {
      const parsed = data.toString("utf8").split("&");
      const formdata = {};
      for (let pair of parsed) {
        const [key, value] = pair.split("=");
        formdata[key] = value;
      }
      console.log(formdata);
      req.body = formdata;
      next();
    });
  } else {
    next();
  }
};*/

// sign up route and html response
app.get("/signup", (req, res) => {
  res.send(`
  <div>
    Your id: ${req.session.userId}
    <form method="POST">
      <input name="email" placeholder="email"/>
      <input name="password" placeholder="password"/>
      <input name="passwordConfirmation" placeholder="password confirmation"/>
      <button>Sign Up</button>
    </form>
  </div>
  `);
});
app.get("/signout", (req, res) => {
  req.session = null;
  res.send("Logged out.");
});
app.get("/signin", (req, res) => {
  if (req.session.userId) {
    return res.send("You're already logged in.");
  }
  res.send(`
   <div>
    Your id: ${req.session.userId}
    <form method="POST">
      <input name="email" placeholder="email"/>
      <input name="password" placeholder="password"/>
      <button>Sign In</button>
    </form>
  </div>
  `);
});
app.post("/signin", async (req, res) => {
  const { email, password } = req.body;
  const existingUser = await usersRepo.getOneBy({ email });
  if (!existingUser) {
    return res.send(`email not found`);
  }
  if (password !== existingUser.password) {
    return res.send("wrong password!");
  }
  // login the user by setting the session property
  req.session.userId = existingUser.id;
  res.send(`Logged in userId: ${req.session.userId}`);
});

app.post("/signup", async (req, res) => {
  console.log(req.body);

  //
  const { email, password, passwordConfirmation } = req.body;
  if (password !== passwordConfirmation) {
    // return a send here to prevent further processing
    return res.send("passwords must match!");
  }
  // while the existing key and the passed in variable name match, no need to spesify the key
  const existingUser = await usersRepo.getOneBy({ email: email });
  console.log(existingUser);
  if (existingUser) {
    return res.send("The given email already used to register a user.");
  }
  // keys match passed in variable names
  const createdUser = await usersRepo.create({ email, password });
  // create a new property in the session object
  req.session.userId = createdUser.id;
  res.send(`created user: ${email}, ${password} ${req.session.userId}`);
  /*if (usersRepo.getOneBy({ email: email })) {
    console.log("Error: user already signed using that email");
  } else console.log("email not existing..proceed");
  */
  //res.send("post sent");
});
