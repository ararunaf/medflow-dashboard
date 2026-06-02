/**
 * Server function — copiloto GPT read-only (interpretação / narrativa / explicação).
 */
import { createServerFn } from "@tanstack/react-start";
import { PermissionError } from "@/lib/domain/operations/errors";
import { isOperationalManager } from "@/lib/auth/rbac";
import {
  buildOperationalGptUserMessage,
  expectOperationalCopilotGptRequest,
  OPERATIONAL_GPT_SYSTEM_PROMPT_PT,
  OPERATIONAL_GPT_TOOLS_SYSTEM_PROMPT_PT,
} from "@/lib/operations/copilot-gpt";
import type { OperationalCopilotGptResponseData } from "@/lib/operations/copilot-gpt/types";
import { OPERATIONAL_GPT_TOOL_DEFINITIONS } from "@/lib/operations/copilot-gpt/operational-gpt-tool-registry";
import {
  executeOperationalGptTool,
  OperationalGptToolRequestCache,
} from "@/lib/operations/copilot-gpt/operational-gpt-tool-executor";
import type { OperationalGptToolName } from "@/lib/operations/copilot-gpt/operational-gpt-tool-registry";
import { runMutation, type MutationResult } from "@/lib/server/fn-helpers";
import {
  completeOperationalCopilotChat,
  completeOperationalCopilotChatWithTools,
} from "@/lib/server/operational-gpt-openai";

export type {
  OperationalCopilotGptRequest,
  OperationalCopilotGptResponseData,
} from "@/lib/operations/copilot-gpt/types";

export const operationalCopilotGptFn = createServerFn({ method: "POST" })
  .inputValidator(expectOperationalCopilotGptRequest)
  .handler(async ({ data }): Promise<MutationResult<OperationalCopilotGptResponseData>> => {
    return runMutation(async (ctx) => {
      if (!isOperationalManager(ctx.role)) {
        throw new PermissionError(
          "Copiloto IA operacional disponível apenas para coordenação e administradores.",
        );
      }

      const correlationId = crypto.randomUUID();
      const user = buildOperationalGptUserMessage({
        payload: data.operationalContextPayload,
        semantic: data.semanticSnapshot,
        mode: data.mode,
        question: data.question,
      });

      if (data.mode === "chat") {
        const cache = new OperationalGptToolRequestCache();
        cache.correlationId = correlationId;
        cache.contextFingerprint = data.operationalContextPayload.fingerprint;
        const toolTrace: OperationalCopilotGptResponseData["toolTrace"] = [];

        const completion = await completeOperationalCopilotChatWithTools({
          system: OPERATIONAL_GPT_TOOLS_SYSTEM_PROMPT_PT,
          user,
          tools: OPERATIONAL_GPT_TOOL_DEFINITIONS,
          runTool: async (name, argumentsJson) => {
            const { content, trace } = await executeOperationalGptTool({
              ctx,
              name: name as OperationalGptToolName,
              argumentsJson,
              cache,
            });
            toolTrace!.push(trace);
            return content;
          },
        });

        return {
          assistantMessage: completion.text,
          fingerprintEcho: data.operationalContextPayload.fingerprint,
          model: completion.model,
          correlationId,
          toolTrace,
          toolCallCount: completion.toolCallCount,
          toolRounds: completion.toolRounds,
        };
      }

      const completion = await completeOperationalCopilotChat({
        system: OPERATIONAL_GPT_SYSTEM_PROMPT_PT,
        user,
      });

      return {
        assistantMessage: completion.text,
        fingerprintEcho: data.operationalContextPayload.fingerprint,
        model: completion.model,
        correlationId,
      };
    });
  });
