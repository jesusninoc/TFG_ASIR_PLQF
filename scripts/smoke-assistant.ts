import { AssistantOrchestrator } from "@/lib/assistant/assistant-orchestrator";
import { UnifiedLogger } from "@/lib/agent/logger";

async function main() {
  const assistant = new AssistantOrchestrator({
    logger: new UnifiedLogger("assistant-smoke"),
  });

  const response = await assistant.handleRequest({
    question: "Busca una GPU NVIDIA y montame una build gaming de 1500 euros",
    history: [],
    context: {
      currentPage: "/",
      cart: [],
    },
    personality: "educational",
  });

  console.log(JSON.stringify(response, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
