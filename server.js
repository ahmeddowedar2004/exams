const express = require("express");
const cors = require("cors");
require("dotenv").config();
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3200;
const admin = require("firebase-admin");
const { doc, updateDoc } = require("firebase-admin/firestore");
const cookieParser = require("cookie-parser");
const CryptoJS = require("crypto-js");
const secretKey = "MZ-exam-@#-library";
function encryptData(data) {
  return CryptoJS.AES.encrypt(data, secretKey).toString();
}
function decryptData(encryptedData) {
  const bytes = CryptoJS.AES.decrypt(encryptedData, secretKey);
  return bytes.toString(CryptoJS.enc.Utf8);
}

app.set("view engine", "ejs");

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT;
const serviceAccount = require(serviceAccountPath);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

// Access FieldValue
const FieldValue = admin.firestore.FieldValue;

app.use(cors());
app.use(cookieParser());
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views")); // Adjust the path if needed
app.use(express.urlencoded({ extended: true })); // Replaces bodyParser.urlencoded
app.use(express.json()); // Replaces bodyParser.json
app.use(express.static(path.join(__dirname, "public")));

// Assign admin role function

async function assignAdminRole(uid) {
  try {
    await admin.auth().setCustomUserClaims(uid, { admin: true });
    console.log("Assigned successfully");
  } catch (error) {
    console.error("Error assigning admin role:", error);
    throw new Error("Failed to assign admin role");
  }
}
// Middleware: Validate Token from Authorization Header
async function validateToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ error: "Unauthorized: Token Missing or Malformed" });
    }

    const token = authHeader.split("Bearer ")[1];
    req.user = await admin.auth().verifyIdToken(token);
    next();
  } catch (error) {
    console.error("Token validation failed:", error.message);
    return res.status(403).json({ error: "Unauthorized: Invalid Token" });
  }
}

// Middleware: Validate Admin Access from UID in Cookies

async function validateAdminAccess(req, res, next) {
  try {
    const uid = req.cookies.uid;
    if (!uid) {
      return res.status(403).json({ error: "Access denied: No UID found" });
    }

    const userRecord = await admin.auth().getUser(uid);
    if (userRecord.customClaims?.admin) {
      return next(); // Proceed if the user is an admin
    }

    return res
      .status(403)
      .json({ error: "Access denied: User is not an admin" });
  } catch (error) {
    console.error("Error verifying user:", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// Endpoint: Set Cookie with UID
app.post("/set-cookie", (req, res) => {
  const { uid } = req.body;

  if (!uid) {
    return res.status(400).json({ error: "UID is required" });
  }

  // Set the cookie
  res.cookie("uid", uid, {
    httpOnly: true, // Prevent client-side JS access
    secure: true, // Ensure the cookie is sent over HTTPS
    sameSite: "Strict", // CSRF protection
    path: "/",
  });

  res.status(200).json({ message: "Cookie set successfully" });
});

// Endpoint: Clear UID Cookie
app.post("/clear-cookie", (req, res) => {
  res.clearCookie("uid", { path: "/" });
  res.status(200).json({ message: "Cookie cleared" });
});

// Admin Endpoint: Fetch All Users
app.get("/admin/users", validateAdminAccess, async (req, res) => {
  try {
    const usersSnapshot = await db.collection("users").get();
    const users = usersSnapshot.docs.map((doc) => {
      const user = doc.data();
      return {
        ...user,
        name: decryptData(user.name),
        email: decryptData(user.email),
        phoneNumber: decryptData(user.phoneNumber),
        // You can add any other fields that need decryption here
      };
    });

    res.render("showUsers", { users });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.delete("/admin/users/:id", validateAdminAccess, async (req, res) => {
  try {
    const userId = req.params.id;
    await db.collection("users").doc(userId).delete();
    res.status(200).send("User deleted successfully");
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/admin/users/details/:id", validateAdminAccess, async (req, res) => {
  try {
    const userId = req.params.id;
    console.log(userId);
    const userDoc = await db.collection("users").doc(userId).get();
    console.log(userDoc);
    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" }); // JSON response
    }

    res.status(200).json(userDoc.data());
  } catch (error) {
    console.error("Error fetching user details:", error.message);
    res.status(500).json({ error: "Internal Server Error" }); // JSON response
  }
});

// API to assign admin role
app.post("/assignAdmin", validateToken, async (req, res) => {
  try {
    const { uid } = req.body;

    if (!uid) {
      return res.status(400).json({ error: "UID is required" });
    }

    await assignAdminRole(uid);
    res.status(200).json({ message: "Admin role assigned successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});
app.get("/assignAdmin", (req, res) => {
  res.sendFile(path.join(__dirname, "src", "assignAdminRole.html"));
});
// Verify Admin Endpoint
app.get("/validateAdmin", validateToken, async (req, res) => {
  try {
    const userUid = req.user.uid;

    const userRecord = await admin.auth().getUser(userUid);
    console.log(userRecord.customClaims);
    if (userRecord.customClaims?.admin) {
      return res.status(200).json({ message: "User is an admin" });
    } else {
      return res.status(403).json({ error: "User is not an admin" });
    }
  } catch (error) {
    console.error("Error verifying admin:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Middleware to check if the user is an admin
const ensureIsAdmin = async (req, res) => {
  const uid = req.params.uid;

  try {
    // Get user details from Firebase
    const userRecord = await admin.auth().getUser(uid);

    // Check if the user has the 'admin' custom claim
    if (userRecord.customClaims && userRecord.customClaims.admin) {
      return res.status(200).json({
        message: `User with UID: ${uid} is an admin`,
        isAdmin: true,
      });
    } else {
      return res.status(403).json({
        message: `User with UID: ${uid} is not an admin`,
        isAdmin: false,
      });
    }
  } catch (error) {
    console.error("Error checking user:", error);
    return res.status(500).json({
      message: "Error fetching user data",
      error: error.message,
    });
  }
};

// Define the API route to check if user is admin
app.get("/ensure-is-admin/:uid", ensureIsAdmin);

app.post("/update-password", async (req, res) => {
  const { uid, newPassword } = req.body;
  try {
    // Validate input
    if (!uid || !newPassword) {
      return res
        .status(400)
        .json({ success: false, message: "UID and password are required." });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long.",
      });
    }

    // Update user's password
    await admin.auth().updateUser(uid, { password: newPassword });

    res
      .status(200)
      .json({ success: true, message: "Password updated successfully." });
  } catch (error) {
    console.error("Error updating password:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Save non-admin requests
app.post("/nonAdminRequest", async (req, res) => {
  try {
    const { uid } = req.body;

    if (!uid) {
      return res.status(400).json({ error: "UID is required" });
    }

    await db.collection("notAdminRequests").doc(uid).set({
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(200).json({ message: "Request saved successfully" });
  } catch (error) {
    console.error("Error saving request:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Fetch exam details
app.get("/admin/exams/:examId", async (req, res) => {
  const { examId } = req.params;

  try {
    const examDoc = await db.collection("exams").doc(examId).get();

    if (!examDoc.exists) return res.status(404).send("Exam not found");

    res.json({ id: examId, ...examDoc.data() });
  } catch (error) {
    res.status(500).send("Failed to fetch exam details");
  }
});

// Approve or reject users
app.post("/admin/users/:id", async (req, res) => {
  const userId = req.params.id;
  const { action } = req.body;

  try {
    if (action === "approve") {
      await db.collection("users").doc(userId).update({ status: "approved" });
    } else if (action === "reject") {
      await db.collection("users").doc(userId).delete();
    }

    res.status(200).send({ message: "Action completed successfully" });
  } catch (error) {
    console.error("Error processing user action:", error);
    res.status(500).send({ message: error.message });
  }
});

app.get("/admin/exams/:examId", async (req, res) => {
  const { examId } = req.params;

  try {
    const examDoc = await db.collection("exams").doc(examId).get();

    if (!examDoc.exists) return res.status(404).send("Exam not found");

    res.json({ id: examId, ...examDoc.data() });
  } catch (error) {
    res.status(500).send("Failed to fetch exam details");
  }
});

// Route to fetch and display all exams
app.get("/admin/all-exams", async (req, res) => {
  try {
    const examsSnapshot = await db.collection("exams").get();
    const exams = examsSnapshot.docs.map((doc) => ({
      id: doc.id,
      name: decryptData(doc.data().ownerName),
      ...doc.data(),
    }));

    res.render("all-exams", { exams });
  } catch (error) {
    console.error("Error fetching exams:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Route to approve an exam
app.post("/admin/approve-exam/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db
      .collection("exams")
      .doc(id)
      .update({ isApproved: true, approvedAt: new Date() });
    res.redirect("/admin/all-exams");
  } catch (error) {
    console.error("Error approving exam:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Route to delete an exam
app.post("/admin/delete-exam/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db.collection("exams").doc(id).delete();
    res.redirect("/admin/all-exams");
  } catch (error) {
    console.error("Error deleting exam:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Route to view a single exam
app.get("/admin/view-exam/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const examDoc = await db.collection("exams").doc(id).get();
    if (!examDoc.exists) {
      return res.status(404).send("Exam not found");
    }
    const exam = {
      id: examDoc.id,
      name: decryptData(examDoc.data().ownerName),
      ...examDoc.data(),
    };
    res.render("view-exam", { exam });
  } catch (error) {
    console.error("Error fetching exam details:", error);
    res.status(500).send("Internal Server Error");
  }
});
// Simulated database methods
const getResults = async (userId, examId, resId) => {
  const exam = (
    await db
      .collection("results")
      .doc(userId)
      .collection(examId)
      .doc(resId)
      .get()
  ).data();
  // console.log(exam);
  const user = (await db.collection("users").doc(userId).get()).data();
  const examData = (await db.collection("exams").doc(examId).get()).data();
  const examTitle = examData.title || "";
  const examSUbject = examData.subjectName;
  const userName = user.name;
  return {
    exam,
    userName,
    examTitle,
    examSUbject,
  };
};

app.get("/results/:userId/:examId/:resId", async (req, res) => {
  const { userId, examId, resId } = req.params;

  // Fetch user results
  const result = await getResults(userId, examId, resId);
  const solvedAt = result.exam.solvedAt;
  const examTitle = result.examTitle;
  const examSUbject = result.examSUbject;

  // Decrypt user name (simulated)
  const userName = decryptData(result.userName);
  res.json({
    ...result,
    userName,
    examTitle,
    examSUbject,
    solvedAt: new Date(solvedAt).toLocaleString(),
  });
});

app.get("/result/:userId/:examId/:resId", async (req, res) => {
  res.sendFile(path.join(__dirname, "src", "examResults.html"));
});

app.get("/testExam/:examId", async (req, res) => {
  const { examId } = req.params;

  try {
    const examDoc = await db.collection("exams").doc(examId).get();

    if (!examDoc.exists) {
      return res.status(404).send("Exam not found");
    }

    const examData = examDoc.data();

    res.json({ exam: examData });
  } catch (error) {
    console.error("Error fetching exam data:", error);
    res.status(500).send("Failed to fetch exam details");
  }
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "src", "admin.html"));
});

app.post("/checkAdmin", async (req, res) => {
  try {
    const { idToken } = req.body;

    // Decode the token
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    // Check if the admin claim exists
    if (decodedToken.admin) {
      res.json({ isAdmin: true });
    } else {
      res.json({ isAdmin: false });
    }
  } catch (error) {
    console.error("Error verifying ID token:", error);
    res.status(500).json({ error: "Failed to verify ID token" });
  }
});

app.get("/profile", (req, res) => {
  res.sendFile(path.join(__dirname, "src", "user.html"));
});

app.get("/exam/:examId", (req, res) => {
  res.sendFile(path.join(__dirname, "src", "exam.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "src", "login.html"));
});

app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "src", "register.html"));
});

app.get("/logout", (req, res) => {
  res.sendFile(path.join(__dirname, "src", "logout.html"));
});

app.get("/create-exam", (req, res) => {
  res.sendFile(path.join(__dirname, "src", "createExam.html"));
});

app.post("/add-solved-exam", async (req, res) => {
  const { userId, examId, examName, mark, subjectName, examOwner } = req.body;

  try {
    if (
      !userId ||
      !examId ||
      !examName ||
      !mark ||
      !subjectName ||
      !examOwner
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    const solvedExamData = {
      examId,
      examName,
      solvedAt: FieldValue.serverTimestamp(),
      mark,
      subjectName,
      examOwner,
    };

    // Add solved exam to the user's solvedExams subcollection
    const userRef = admin.firestore().collection("users").doc(userId);
    await userRef.collection("solvedExams").add(solvedExamData);

    res.status(200).json({
      success: true,
      message: "Solved exam added successfully.",
    });
  } catch (error) {
    console.error("Error adding solved exam:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to add solved exam.",
    });
  }
});

app.get("/get-solved-exams/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required.",
      });
    }

    const resultsCollectionRef = db.collection("results");
    const userResultsRef = resultsCollectionRef.doc(userId);

    // Get all subcollections of the user's document (these are the random ID subcollections)
    const subcollectionsSnapshot = await userResultsRef.listCollections();
    const allExamData = [];
    for (const subcollection of subcollectionsSnapshot) {
      const examsSnapshot = await subcollection.get();
      examsSnapshot.forEach((examDoc) => {
        allExamData.push({ resultId: examDoc.id, examData: examDoc.data() });
      });
    }
    res.status(200).json({
      success: true,
      solvedExams: allExamData,
    });
    return;
  } catch (error) {
    console.error("Error fetching solved exams:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch solved exams.",
    });
  }
});

app.put("/edit-exam", async (req, res) => {
  const { examId, title, timer, questions } = req.body;

  if (
    !examId ||
    !title ||
    typeof timer !== "number" ||
    !Array.isArray(questions)
  ) {
    return res
      .status(400)
      .json({ error: "Missing or invalid required fields." });
  }

  try {
    // Get Firestore reference for the exam document
    const examRef = db.collection("exams").doc(examId);

    // Update the document
    await examRef.update({
      title,
      timer,
      questions,
      updatedAt: new Date(),
    });

    res.status(200).json({ message: "Exam updated successfully." });
  } catch (error) {
    console.error("Error updating exam:", error);
    res.status(500).json({ error: "Failed to update exam." });
  }
});

app.get("/edit-exam/:examId", async (req, res) => {
  const { examId } = req.params;

  try {
    // Validate examId
    if (!examId) {
      return res.status(400).send("Exam ID is required");
    }

    // Fetch exam data from Firestore
    const examRef = db.collection("exams").doc(examId);
    const examDoc = await examRef.get();

    if (!examDoc.exists) {
      return res.status(404).send("Exam not found");
    }

    // Serve the HTML file
    res.sendFile(path.join(__dirname, "src", "edit-exam.html"));
  } catch (error) {
    console.error("Error fetching exam data:", error);
    res.status(500).send("Failed to fetch exam data. Please try again.");
  }
});

app.get("/exams/:examId", async (req, res) => {
  const { examId } = req.params;

  try {
    // Validate `examId`
    if (!examId) {
      return res.status(400).json({ error: "Exam ID is required" });
    }

    // Fetch exam data from Firestore
    const examRef = db.collection("exams").doc(examId);
    const examDoc = await examRef.get();

    if (!examDoc.exists) {
      return res.status(404).json({ error: "Exam not found" });
    }

    // Respond with the exam data
    res.status(200).json({
      success: true,
      exam: { id: examDoc.id, ...examDoc.data() },
    });
  } catch (error) {
    console.error("Error fetching exam data:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch exam data. Please try again later.",
    });
  }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "src", "home.html"));
});

app.use((req, res) => {
  res.status(404).send({ error: "Route not found" });
});
// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
