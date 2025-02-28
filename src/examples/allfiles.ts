import fs from "fs";
import { FigmaCalculator } from "../index";

import { ProcessedPage } from "../models/stats";
import { FIGMA_TOKEN } from "./token";

const figmaCalculator = new FigmaCalculator();

const STYLE_TEAM_ID = "740326391796487610";
const TEAM_IDS = [
  // "740326391796487610",
  "810275658963931110",
  "1265745180296222701",
  "740987236793396428",
  "1288143691462128259",
  "1062883821222503942",
  "1332827263422764017",
  "1382421006239309196",
  "1080294811112632949",
  "1051025699358218721",
];
const onlyDevStatus = false; // Toggle this to enable/disable dev status filtering

// used to fetch styles and components
figmaCalculator.setAPIToken(FIGMA_TOKEN);

const getLibraryComponentAdoption = (aggregates: any) => {
  let totalNodes = 0;
  let libraryNodes = 0;

  for (const counts of aggregates) {
    const { totalNodes: total, libraryNodes: library, hiddenNodes, ignoredNodes } = counts;
    totalNodes += total - hiddenNodes - ignoredNodes;
    libraryNodes += library;
  }

  return {
    total: totalNodes,
    library: libraryNodes,
    percentage: Math.ceil((libraryNodes / totalNodes) * 10000) / 100,
  };
};

const doWork = async () => {
  // optional: if not in figma plugin environment, load a file with this
  const { files } = await figmaCalculator.getFilesForTeams(TEAM_IDS, 2, false);

  // load up any style libraries
  const comps = await figmaCalculator.loadComponents(STYLE_TEAM_ID);
  const styles = await figmaCalculator.loadStyles(STYLE_TEAM_ID);

  const compsj = JSON.stringify(comps, null, 2);
  const stylesj = JSON.stringify(styles, null, 2);
  fs.writeFileSync("../comps.json", compsj);
  fs.writeFileSync("../styles.json", stylesj);

  const allPages: ProcessedPage[] = [];

  console.log("Total File Count:", files.length);

  // Initialize counters for this file
  let totalPages = 0;
  let devReadyPages = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    try {
      await figmaCalculator.fetchCloudDocument(file.key);
    } catch (ex) {
      console.log(`Failed to fetch ${file.key}: ${file.name}`);
      continue;
    }

    console.log(`Processing file ${i + 1} of ${files.length}: ${file.name}`);

    // run through all of the pages and process them
    for (const page of figmaCalculator.getAllPages()) {
      totalPages++;
      let pageToProcess = page;

      if (onlyDevStatus) {
        const designWithDevStatus = page.children.filter((item) => {
          if ("devStatus" in item && item.devStatus?.type === "READY_FOR_DEV") {
            return item;
          }
        });

        if (!designWithDevStatus.length) {
          console.log(`Skipping page ${page.name} - no dev-ready items`);
          continue;
        }

        devReadyPages++;
        pageToProcess = {
          ...page,
          children: designWithDevStatus,
        };
        console.log(`Processing page ${page.name} with ${designWithDevStatus.length} dev-ready items`);
      }

      const processedNodes = figmaCalculator.processTree(pageToProcess, {
        onProcessNode: (node) => {
          for (const check of node.lintChecks) {
            // example: show the text linting results and suggestions
            if (check.checkName === "Text-Style" && check.matchLevel === "Partial") {
              // console.log(check.suggestions);
            }
          }
        },
      });

      const pageDetails: ProcessedPage = {
        file,
        pageAggregates: processedNodes.aggregateCounts,
        pageName: page.name,
      };
      allPages.push(pageDetails);
    }
  }

  const teamBreakdown = figmaCalculator.getBreakDownByTeams(allPages);

  const libraryAdoption = getLibraryComponentAdoption(allPages.map((page) => page.pageAggregates));

  console.log("Library Component Adoption:", {
    totalNodes: libraryAdoption.total,
    libraryNodes: libraryAdoption.library,
    percentage: libraryAdoption.percentage + "%",
  });
  console.log("Total Pages:", totalPages);
  console.log("Dev Ready Pages:", devReadyPages);
  console.log("Team Breakdown:", JSON.stringify(teamBreakdown, null, 2));
};

doWork();
