import fs from "fs";
import { FigmaCalculator } from "../index";

import { ProcessedPage } from "../models/stats";
import { FIGMA_TOKEN } from "./token";

const figmaCalculator = new FigmaCalculator();

const STYLE_TEAM_ID = "740326391796487610";
const TEAM_IDS = ["1080294811112632949"];
const onlyDevStatus = true; // Toggle this to enable/disable dev status filtering

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

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    console.log("File Name: " + file.name);
    try {
      await figmaCalculator.fetchCloudDocument(file.key);
    } catch (ex) {
      console.log(`Failed to fetch ${file.key}`);
      continue;
    }

    console.log(`Processing file`);

    // run through all of the pages and process them
    for (const page of figmaCalculator.getAllPages()) {
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

  // Calculate library component adoption for all pages
  const libraryAdoption = getLibraryComponentAdoption(allPages.map((page) => page.pageAggregates));

  console.log("Library Component Adoption:", {
    totalNodes: libraryAdoption.total,
    libraryNodes: libraryAdoption.library,
    percentage: libraryAdoption.percentage + "%",
  });
  console.log("Team Breakdown:", JSON.stringify(teamBreakdown, null, 2));
};

doWork();
