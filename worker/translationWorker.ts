import { Worker } from "bullmq";
import { db } from "../lib/db";
import { processIndustrialTranslation } from "../lib/translation";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

console.log("Starting SiteSync Translation Worker...");

const worker = new Worker(
  "report-translation-queue",
  async (job) => {
    console.log(`Processing report translation job ID: ${job.id}`);
    const { reportId, sourceLanguage, tasks, equipment, issues } = job.data;

    try {
      const translationResult = await processIndustrialTranslation({
        sourceLang: sourceLanguage,
        tasks,
        equipment,
        issues,
      });

      if (reportId && !reportId.startsWith("rpt_")) {
        await db.dailyReport.update({
          where: { id: reportId },
          data: {
            translationsJson: translationResult as any,
            status: "TRANSLATED",
          },
        });
      }

      console.log(`Successfully completed translation job ${job.id}`);
      return translationResult;
    } catch (err) {
      console.error(`Failed translation job ${job.id}:`, err);
      throw err;
    }
  },
  {
    connection: { url: redisUrl },
  }
);

worker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed with error:`, err);
});
