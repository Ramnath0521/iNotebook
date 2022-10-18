const express = require("express");
const router = express.Router();
const fetchuser = require("../middleware/fetchuser");
const Note = require("../models/Note");
const { body, validationResult } = require("express-validator");

//Route 1 :  Get all notes using : GET localhost:5000/api/notes/fetchallnotes ; login require
router.get("/fetchallnotes", fetchuser, async (req, res) => {
  try {
    const notes = await Note.find({ user: req.user.id });
    res.json(notes);
  } catch (error) {
    console.error(error.message);
    res.status(500).json("Some error occured");
  }
});

//Route 2 :  Add a new Note using : POSt localhost:5000/api/notes/addnote ; login require
router.post(
  "/addnote",
  fetchuser,
  [
    body("title", "Enter a valid title(Minimum 3 characters)").isLength({
      min: 3,
    }),
    body("description", "description must be atleast 5 characters").isLength({
      min: 5,
    }),
  ],
  async (req, res) => {
    try {
      const { title, description, tag } = req.body;
      // If there are errors, bad request is sent
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const note = new Note({
        title,
        description,
        tag,
        user: req.user.id,
      });
      const savedNote = await note.save();
      res.json(savedNote);
    } catch (error) {
      console.error(error.message);
      res.status(500).json("Some error occured");
    }
  }
);

//Route 3 :  Update an exisitng Note using : Put localhost:5000/api/notes/updatenote/:id ; login require
router.put("/updatenote/:id", fetchuser, async (req, res) => {
  const { title, description, tag } = req.body;
  try {
    //Create a newNote object
    const newNote = {};
    if (title) {
      newNote.title = title;
    }
    if (description) {
      newNote.description = description;
    }
    if (tag) {
      newNote.tag = tag;
    }

    //Find the note to be updated and update it
    let note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).send("Not found");
    }

    if (note.user.toString() !== req.user.id) {
      return res.status(401).send("Not Allowed");
    }
    note = await Note.findByIdAndUpdate(
      req.params.id,
      { $set: newNote },
      { new: true }
    );
    res.json({ note });
  } catch (error) {
    console.error(error.message);
    res.status(500).json("Some error occured");
  }
});

//Route 4 : Delete an exisitng Note using : DELETE localhost:5000/api/notes/deletenote/:id ; login require
router.delete("/deletenote/:id", fetchuser, async (req, res) => {
  try {
    //Find the note to be  delete and delete it
    let note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).send("Not found");
    }

    // Allow deletion if user owns the Note
    if (note.user.toString() !== req.user.id) {
      return res.status(401).send("Not Allowed");
    }
    note = await Note.findByIdAndDelete(req.params.id);
    res.json({ Success: "Your note has been deleted", note: note });
  } catch (error) {
    console.error(error.message);
    res.status(500).json("Some error occured");
  }
});
module.exports = router;
