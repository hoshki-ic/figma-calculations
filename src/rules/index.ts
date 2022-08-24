/* eslint-disable no-undef */

import {
  ComponentBucket,
  FigmaTeamComponent,
  FigmaTeamStyle,
  StyleBucket,
} from "../models/figma";

import { LintCheck } from "../models/stats";
import checkFillStyleMatch from "./fillStyle";
import checkStrokeStyleMatch from "./strokeStyle";
import checkTextMatch from "./textStyle";

/**
 * Run through all partial matches, and make exceptions depending on rules
 */
export const runSimilarityChecks = (
  styleBucket: StyleBucket,
  targetNode: BaseNode
): LintCheck[] => {
  const checks: ((
    styleBucket: StyleBucket,
    targetNode: BaseNode
  ) => LintCheck)[] = [
    checkTextMatch,
    checkStrokeStyleMatch,
    checkFillStyleMatch,
  ];

  const results = [];
  for (const check of checks) {
    const lintCheck = check(styleBucket, targetNode);
    results.push(lintCheck);
  }

  return results;
};

/**
 * Check if a Node Type overlaps
 * @param types
 * @param node
 * @returns
 */
export function isNodeOfTypeAndVisible(types: string[], node: BaseNode) {
  return types.includes(node.type);
}

/**
 *
 * @param styles
 * @returns Object with style name as key and style as value
 * @description Creates a map of styles by name
 */
export function generateStyleBucket(styles: FigmaTeamStyle[]): StyleBucket {
  // create hashmap of styles by styleType
  const styleBuckets: StyleBucket = {};

  for (const style of styles) {
    if (!styleBuckets[style.style_type]) {
      styleBuckets[style.style_type] = {};
    }

    styleBuckets[style.style_type][style.key] = style;
  }
  return styleBuckets;
}

/**
 *
 * @param styles
 * @returns Object with style name as key and style as value
 * @description Creates a map of styles by name
 */
export function generateComponentMap(
  components: FigmaTeamComponent[]
): ComponentBucket {
  // create hashmap of styles by styleType
  const componentBucket: ComponentBucket = {};

  // create a map of the team components by their key
  for (const comp of components) {
    const getComponentReadableName = () => {
      if (comp.name.includes("=")) {
        return comp.containing_frame.name;
      }

      return comp.name;
    };

    if (componentBucket)
      componentBucket[comp.key] = { name: getComponentReadableName() };
  }
  return componentBucket;
}
