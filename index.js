require("dotenv").config();
const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
const port = process.env.PORT;

app.use(cors());
app.use(express.json());

// function createToken(user) {
//   const token = jwt.sign(
//     {
//       email: user.email,
//     },
//     "secret",
//     { expiresIn: "7d" }
//   );
//   return token;
// }

// function verifyToken(req, res, next) {
//   const token = req.headers.authorization.split(" ")[1];
//   const verify = jwt.verify(token, "secret");
//   if (!verify?.email) {
//     return res.send("You are not authorized");
//   }
//   req.user = verify.email;
//   next();
// }

const uri = process.env.DATABASE_URL;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const db = client.db("furniture-database");
    const userCollection = db.collection("users");
    const productCollection = db.collection("products");

    // product
    app.post("/product", async (req, res) => {
      const productsData = req.body;
      const result = await productCollection.insertOne(productsData);
      res.send(result);
    });

    app.get("/products", async (req, res) => {
      try {
        if (Object.keys(req.query).length === 0) {
          const productData = productCollection.find();
          const result = await productData.toArray();
          return res.send(result);
        }

        const { category, searchTerm } = req.query;

        let query = {};
        if (category) {
          query.category = category;
        }
        if (searchTerm) {
          query.name = new RegExp(searchTerm, "i");
        }

        Object.assign(query);

        const productData = productCollection.find(query);
        const result = await productData.toArray();
        res.send(result);
      } catch (error) {
        res.send({
          status: 500,
          message: "Can not fetch data",
        });
      }
    });

    app.get("/product/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await productCollection.findOne(query);
      res.json(result);
    });

    app.patch("/product/:id", async (req, res) => {
      const id = req.params.id;
      const updatedData = req.body;
      const result = await productCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedData }
      );
      res.send(result);
    });

    app.delete("/product/:id", async (req, res) => {
      const id = req.params.id;
      const result = await productCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });

    //users

    //post user data
    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await userCollection.insertOne(user);
      res.json(result);
    });

    //get single user data
    app.get("/user/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await userCollection.findOne(query);
      res.json(result);
    });

    // upsert user
    app.put("/users", async (req, res) => {
      const user = req.body;
      const filter = { email: user.email };
      const options = { upsert: true };
      const updateDoc = { $set: user };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      res.json(result);
    });

    // admin

    // get admin data
    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);

      if (user?.role === "admin") {
        res.send(user);
      } else {
        res.send({ status: 404, message: "user is not an admin" });
      }
    });

    //update admin data

    app.patch("/admin/:id", async (req, res) => {
      const id = req.params.id;
      const updatedData = req.body;
      const result = await userCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedData }
      );
      res.send(result);
    });

    // // user
    // app.post("/user", async (req, res) => {
    //   const user = req.body;

    //   const token = createToken(user);
    //   const isUserExist = await userCollection.findOne({ email: user?.email });
    //   if (isUserExist?._id) {
    //     return res.send({
    //       status: "success",
    //       message: "Login success",
    //       token,
    //     });
    //   }
    //   await userCollection.insertOne(user);
    //   return res.send({ token });
    // });

    // // user/test@gmail

    // app.get("/user/get/:id", async (req, res) => {
    //   const id = req.params.id;
    //   console.log(id);
    //   const result = await userCollection.findOne({ _id: new ObjectId(id) });
    //   res.send(result);
    // });

    // app.get("/user/:email", async (req, res) => {
    //   const email = req.params.email;
    //   const result = await userCollection.findOne({ email });
    //   res.send(result);
    // });

    // app.patch("/user/:email", async (req, res) => {
    //   const email = req.params.email;
    //   const userData = req.body;
    //   const result = await userCollection.updateOne(
    //     { email },
    //     { $set: userData },
    //     { upsert: true }
    //   );
    //   res.send(result);
    // });

    console.log("Database is connected");
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Furniture server API");
});

app.listen(port, (req, res) => {
  console.log("App is listening on port :", port);
});
