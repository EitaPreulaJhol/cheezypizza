import { z } from 'zod'

export enum MessageType {
  RequestInfo = 'RequestInfo',
  Info = 'Info',
  HashUpdate = 'HashUpdate',
  Start = 'Start',
  Chunk = 'Chunk',
  ChunkAck = 'ChunkAck',
  Pause = 'Pause',
  Done = 'Done',
  Error = 'Error',
  PasswordRequired = 'PasswordRequired',
  UsePassword = 'UsePassword',
  Report = 'Report',
}

// Shared bounds keep peer-supplied metadata small and header-safe.
const fileNameSchema = z
  .string()
  .min(1)
  .max(255)
  .refine(
    (v) =>
      v.trim().length > 0 &&
      !v.includes('/') &&
      !v.includes('\\') &&
      !v.includes('\0') &&
      !v.includes('..'),
    { message: 'Invalid file name' },
  )

const sizeSchema = z.number().int().nonnegative().max(20_000_000_000)
const offsetSchema = z.number().int().nonnegative().max(20_000_000_000)
const sha256Schema = z
  .string()
  .regex(/^[0-9a-f]{64}$/i)
  .optional()

// Chunk payloads must be raw bytes, never arbitrary objects.
const bytesSchema = z.union(
  [z.instanceof(Uint8Array), z.instanceof(ArrayBuffer)],
  {
    message: 'Invalid chunk bytes',
  },
)

export const RequestInfoMessage = z.object({
  type: z.literal(MessageType.RequestInfo),
  browserName: z.string().max(128),
  browserVersion: z.string().max(128),
  osName: z.string().max(128),
  osVersion: z.string().max(128),
  mobileVendor: z.string().max(128),
  mobileModel: z.string().max(128),
})

export const InfoMessage = z.object({
  type: z.literal(MessageType.Info),
  files: z
    .array(
      z.object({
        fileName: fileNameSchema,
        size: sizeSchema,
        type: z.string().max(256),
        sha256: sha256Schema,
      }),
    )
    .max(100),
})

export const HashUpdateMessage = z.object({
  type: z.literal(MessageType.HashUpdate),
  fileName: fileNameSchema,
  sha256: z.string().regex(/^[0-9a-f]{64}$/i),
})

export const StartMessage = z.object({
  type: z.literal(MessageType.Start),
  fileName: fileNameSchema,
  offset: offsetSchema,
})

export const ChunkMessage = z.object({
  type: z.literal(MessageType.Chunk),
  fileName: fileNameSchema,
  offset: offsetSchema,
  bytes: bytesSchema,
  final: z.boolean(),
})

export const ChunkAckMessage = z.object({
  type: z.literal(MessageType.ChunkAck),
  fileName: fileNameSchema,
  offset: offsetSchema,
  bytesReceived: z.number().int().nonnegative().max(20_000_000_000),
})

export const DoneMessage = z.object({
  type: z.literal(MessageType.Done),
})

export const ErrorMessage = z.object({
  type: z.literal(MessageType.Error),
  error: z.string().max(1000),
})

export const PasswordRequiredMessage = z.object({
  type: z.literal(MessageType.PasswordRequired),
  errorMessage: z.string().max(1000).optional(),
})

export const UsePasswordMessage = z.object({
  type: z.literal(MessageType.UsePassword),
  password: z.string().min(1).max(256),
})

export const PauseMessage = z.object({
  type: z.literal(MessageType.Pause),
})

export const ReportMessage = z.object({
  type: z.literal(MessageType.Report),
})

export const Message = z.discriminatedUnion('type', [
  RequestInfoMessage,
  InfoMessage,
  HashUpdateMessage,
  StartMessage,
  ChunkMessage,
  ChunkAckMessage,
  DoneMessage,
  ErrorMessage,
  PasswordRequiredMessage,
  UsePasswordMessage,
  PauseMessage,
  ReportMessage,
])

export type Message = z.infer<typeof Message>

export function decodeMessage(data: unknown): Message {
  return Message.parse(data)
}
