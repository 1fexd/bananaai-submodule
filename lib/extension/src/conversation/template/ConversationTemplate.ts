import zod from "zod";

const sectionsSchema = zod.array(
  zod.discriminatedUnion("type", [
    zod.object({
      type: zod.literal("lines"),
      title: zod.string(),
      lines: zod.array(zod.string()),
    }),
    zod.object({
      type: zod.literal("optional-selected-code"),
      title: zod.string(),
    }),
    zod.object({
      type: zod.literal("conversation"),
      excludeFirstMessage: zod.boolean().optional(),
      roles: zod.object({
        bot: zod.string(),
        user: zod.string(),
      }),
    }),
  ])
);

export type Sections = zod.infer<typeof sectionsSchema>;

const promptSchema = zod.object({
  template: zod.string(),
  maxTokens: zod.number(),
  stop: zod.array(zod.string()).optional(),
  temperature: zod.number().optional(),
});

export type Prompt = zod.infer<typeof promptSchema>;

const responseSchema = zod.object({
  placeholder: zod.string().optional(),
  prompt: promptSchema,
});

const variableBaseSchema = zod.object({
  name: zod.string(),
  constraints: zod
    .array(
      zod.discriminatedUnion("type", [
        zod.object({
          type: zod.literal("text-length"),
          min: zod.number(),
        }),
      ])
    )
    .optional(),
});

const variableSchema = zod.discriminatedUnion("type", [
  variableBaseSchema.extend({
    type: zod.literal("constant"),
    value: zod.string(),
  }),
  variableBaseSchema.extend({
    type: zod.literal("message"),
    index: zod.number(),
    property: zod.enum(["content"]),
  }),
  variableBaseSchema.extend({
    type: zod.literal("active-editor"),
    property: zod.enum([
      "language-id",
      "selected-text",
      "selected-location-text",
      "filename",
    ]),
  }),
]);

export type Variable = zod.infer<typeof variableSchema>;

const baseTemplateSchema = zod.object({
  id: zod.string(),
  engineVersion: zod.literal(0),
  label: zod.string(),
  description: zod.string(),
  header: zod.object({
    title: zod.string(),
    useFirstMessageAsTitle: zod.boolean().optional(), // default: false
    icon: zod.object({
      type: zod.literal("codicon"),
      value: zod.string(),
    }),
  }),
  isEnabled: zod.boolean().optional(), // default: true
  variables: zod.array(variableSchema).optional(),
});

export const conversationTemplateSchema = zod.discriminatedUnion("type", [
  baseTemplateSchema.extend({
    type: zod.literal("basic-chat"),
    chat: responseSchema,
  }),
  baseTemplateSchema.extend({
    type: zod.literal("selected-code-analysis-chat"),
    analysis: responseSchema,
    chat: responseSchema,
  }),
]);

export type ConversationTemplate = zod.infer<typeof conversationTemplateSchema>;
