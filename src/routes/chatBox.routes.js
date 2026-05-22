import express from 'express';

const router = express.Router();

router.post('/stream', (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ reply: "Prompt missing hai bhai!" });
    }

    // console.log("Static Bot hitting for prompt:", prompt);
    const input = prompt.toLowerCase().trim();
    let responseText = "";

    if (input.includes('access') && input.includes('course')) {
      responseText = "To access your course, go to the 'My Learning' section on the dashboard. Click on the course card to view the modules, lectures, and tracking progress.";
    } 
    else if (input.includes('enroll')) {
      responseText = "To enroll in a new course, navigate to the 'Course Catalog' from the top menu, browse the available domains, select your desired course, and click on the 'Enroll Now' button.";
    } 
    else if (input.includes('download') && input.includes('assignment')) {
      responseText = "You can download the assignment PDF by opening the specific course module, clicking on the 'Assignments' tab, and selecting the download icon next to the resource file.";
    } 
    else if (input.includes('mock') || input.includes('test')) {
      responseText = "To give a mock test, go to the 'Assessments' section from your sidebar, select the scheduled test, read the guidelines carefully, and click 'Start Test'.";
    } 
    else if (input.includes('connect') || input.includes('instructor')) {
      responseText = "To connect with your instructor, you can use the 'Communication Module' inside the learning platform, click on 'New Message', select your instructor's name, or post your query directly in the course discussion forum.";
    } 
    else {
      responseText = "Hello Shahin! You can ask me how to access courses, enroll in new ones, download assignments, take mock tests, or connect with trainers.";
    }

    // console.log("Sending plain string response to prevent thinking loop.");
    
    
    return res.status(200).json({ reply: responseText });

  } catch (error) {
    console.error("Static Bot Error:", error.message);
    return res.status(500).json({ reply: "Internal server error occurred." });
  }
});

export default router;