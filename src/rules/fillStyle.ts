import jp from "jsonpath";

import { StyleBucket } from "../models/figma";
import { LintCheck, LintCheckName, LintSuggestion } from "../models/stats";

import {
  getStyleLookupDefinitions,
  hasValidFillToMatch,
  isNodeOfTypeAndVisible,
  LintCheckOptions,
} from ".";
import { isExactStyleMatch } from "./utils/styles/exact";
import getStyleLookupMatches from "./utils/styles/lookup";
import { figmaRGBToHex } from "../utils/rgbToHex";

export default function checkFillStyleMatch(
  styleBucket: StyleBucket,
  targetNode: BaseNode,
  opts?: LintCheckOptions
): LintCheck {
  const checkName: LintCheckName = "Fill-Style";

  // check if correct Node Type
  // REST API uses "REGULAR_POLYGON" but Figma uses "POLYGON"
  if (
    !isNodeOfTypeAndVisible(
      ["ELLIPSE", "INSTANCE", "POLYGON", "REGULAR_POLYGON", "RECTANGLE", "STAR", "TEXT", "VECTOR"],
      targetNode
    )
  )
    return { checkName, matchLevel: "Skip", suggestions: [] };

  // Don't do style processing if a fill color variable is in-use
  const colorVariables = jp.query(
    targetNode,
    "$.fills[*].boundVariables.color"
  );
  if (colorVariables.length > 0)
    return { checkName, matchLevel: "Skip", suggestions: [] };

  if (!hasValidFillToMatch(targetNode as MinimalFillsMixin))
    return { checkName, matchLevel: "Skip", suggestions: [] };

  // check if style is exact match
  const exactMatch = isExactStyleMatch("FILL", styleBucket, targetNode);

  if (exactMatch)
    return {
      checkName,
      matchLevel: "Full",
      suggestions: [],
      exactMatch: { key: exactMatch.key },
    };

  if (opts?.hexStyleMap) {
    const { hexStyleMap } = opts;
    const fillProps = getStyleLookupDefinitions("FILL");

    if (fillProps) {
      const [r, g, b, a] = fillProps.map((prop) => {
        const pathToUse =
          typeof figma === "undefined"
            ? prop.nodePath
            : prop.figmaPath || prop.nodePath;

        return jp.query(targetNode, pathToUse)[0];
      });

      // get the hex code
      const hex = figmaRGBToHex({ r, g, b, a }).toUpperCase();

      const suggestions: LintSuggestion[] = [];

      if (hexStyleMap[hex]) {
        const styleKeys = hexStyleMap[hex];
        const styleKey =
          targetNode.type === "TEXT" ? styleKeys.text : styleKeys.fill;
        if (styleKey) {
          suggestions.push({
            type: "Style",
            message: `Color Override Exists in Library for hex ${hex}`,
            styleKey,
            name: hex,
            description: "Direct hex color mapping override",
          });
        }
        return { matchLevel: "Partial", checkName, suggestions };
      }
    }
  }

  if (opts?.styleLookupMap) {
    const { matchLevel, suggestions } = getStyleLookupMatches(
      checkName,
      opts.styleLookupMap,
      "FILL",
      targetNode
    );

    return { checkName, matchLevel, suggestions };
  }

  return { checkName, matchLevel: "None", suggestions: [] };
}
