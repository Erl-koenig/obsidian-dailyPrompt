import { getEditorForFile } from "./fileEditor";
import type { App, TFile } from "obsidian";

export function getHeadingLevel(line = ""): number | null {
  const heading = line.match(/^(#{1,6})\s+\S/);
  return heading ? heading[1].length : null;
}

export async function updateSection(
  app: App,
  file: TFile,
  heading: string,
  sectionContents: string
): Promise<void> {
  const headingLevel = getHeadingLevel(heading);

  const { vault } = app;
  const fileContents = await vault.read(file);
  const fileLines = fileContents.split("\n");

  let logbookSectionLineNum = -1;
  let nextSectionLineNum = -1;

  for (let i = 0; i < fileLines.length; i++) {
    if (fileLines[i].trim() === heading) {
      logbookSectionLineNum = i;
    } else if (logbookSectionLineNum !== -1) {
      const currLevel = getHeadingLevel(fileLines[i]);
      if (currLevel && currLevel <= headingLevel) {
        nextSectionLineNum = i;
        break;
      }
    }
  }

  const editor = getEditorForFile(app, file);
  if (editor) {
    if (logbookSectionLineNum !== -1) {
      const from = { line: logbookSectionLineNum + 1, ch: 0 }; // Start from next line after heading
      const to =
        nextSectionLineNum !== -1
          ? { line: nextSectionLineNum - 1, ch: 0 }
          : { line: fileLines.length, ch: 0 }; // End till last line or before next section
      editor.replaceRange(`${sectionContents}\n`, from, to);
      return;
    } else {
      const pos = { line: fileLines.length, ch: 0 }; // Insert at the end of file
      editor.replaceRange(`\n\n${sectionContents}`, pos, pos);
      return;
    }
  }

  if (logbookSectionLineNum !== -1) {
    const prefix = fileLines.slice(0, logbookSectionLineNum + 1); // Include the heading line
    const suffix =
      nextSectionLineNum !== -1 ? fileLines.slice(nextSectionLineNum) : []; // Include the next section
    return vault.modify(
      file,
      [...prefix, sectionContents, ...suffix].join("\n")
    );
  } else {
    // If the section doesn't exist, add it at the end of the file
    return vault.modify(file, [...fileLines, "", heading, sectionContents].join("\n"));
  }
}
