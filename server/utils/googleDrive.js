// server/utils/googleDrive.js
import { google } from "googleapis";
import path from "path";
import fs from "fs";
import os from "os";
import auth from "../config/googleAuth.js";

const drive = google.drive({ version: "v3", auth });

export async function downloadResumesFromDrive(driveLink) {
  try {
    // Extract folder ID from drive link
    const folderId = extractFolderIdFromLink(driveLink);
    if (!folderId) {
      throw new Error("Invalid Google Drive link");
    }

    // Create temp directory
    const tempDir = path.join(os.tmpdir(), "recruiter-resumes-" + Date.now());
    fs.mkdirSync(tempDir, { recursive: true });

    // List files in the folder
    const files = await listFilesInFolder(folderId);
    
    // Download each file
    for (const file of files) {
      await downloadFile(file.id, path.join(tempDir, file.name));
    }

    return tempDir;
  } catch (error) {
    console.error("Error downloading from Drive:", error);
    throw error;
  }
}

function extractFolderIdFromLink(link) {
  // Handle different drive link formats
  const patterns = [
    /\/folders\/([a-zA-Z0-9-_]+)/,
    /id=([a-zA-Z0-9-_]+)/,
    /^([a-zA-Z0-9-_]+)$/
  ];

  for (const pattern of patterns) {
    const match = link.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

async function listFilesInFolder(folderId) {
  const res = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    fields: "files(id, name)",
    spaces: "drive"
  });
  return res.data.files;
}

async function downloadFile(fileId, destPath) {
  const dest = fs.createWriteStream(destPath);
  const res = await drive.files.get(
    { fileId, alt: "media" },
    { responseType: "stream" }
  );
  return new Promise((resolve, reject) => {
    res.data
      .on("end", () => resolve())
      .on("error", err => reject(err))
      .pipe(dest);
  });
}
