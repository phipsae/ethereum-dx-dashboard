import { llmDetect, setClassifierModel } from "./analysis/llm-detector.js";
import fs from "node:fs";

const filePath = process.argv[2];
const model = process.argv[3];

if (!filePath) {
  console.error("Usage: npx tsx src/reclassify-one.ts <result.json> [model]");
  process.exit(1);
}

if (model) setClassifierModel(model);

const result = JSON.parse(fs.readFileSync(filePath, "utf-8"));
const detection = await llmDetect(result.response.content, result.promptText);

console.log("Old:", result.analysis.detection.network, result.analysis.detection.ecosystem);
console.log("New:", detection.network, detection.ecosystem, detection.strength);
console.log("Reasoning:", detection.reasoning);
console.log("Votes:", JSON.stringify(detection.all));

result.analysis.detection = detection;
fs.writeFileSync(filePath, JSON.stringify(result, null, 2));
console.log("\nFile updated.");
