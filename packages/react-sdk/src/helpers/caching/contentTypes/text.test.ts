import { it, expect, describe, vi } from "vitest";
import { Client, ContentTypeText } from "@xmtp/xmtp-js";
// eslint-disable-next-line import/no-extraneous-dependencies
import { Wallet } from "ethers";
import {
  ContentTypeAttachment,
  type Attachment,
} from "@xmtp/content-type-remote-attachment";
import { type CachedMessageWithId } from "@/helpers/caching/messages";
import { getDbInstance } from "@/helpers/caching/db";
import type { CachedConversationWithId } from "@/helpers/caching/conversations";
import {
  processText,
  textCacheConfig,
} from "@/helpers/caching/contentTypes/text";

const testWallet = Wallet.createRandom();
const db = getDbInstance();

describe("ContentTypeText caching", () => {
  it("should have the correct cache config", () => {
    expect(textCacheConfig.namespace).toEqual("text");
    expect(textCacheConfig.codecs).toBeUndefined();
    expect(textCacheConfig.processors[ContentTypeText.toString()]).toEqual([
      processText,
    ]);
  });

  describe("processText", () => {
    it("should save a message to the cache", async () => {
      const testClient = await Client.create(testWallet, { env: "local" });
      const testConversation = {
        id: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        isReady: false,
        topic: "testTopic",
        peerAddress: "testPeerAddress",
        walletAddress: testWallet.address,
      } satisfies CachedConversationWithId;
      const testMessage = {
        id: 1,
        walletAddress: testWallet.address,
        conversationTopic: "testTopic",
        content: "test",
        contentType: ContentTypeText.toString(),
        isSending: false,
        hasSendError: false,
        sentAt: new Date(),
        status: "unprocessed",
        senderAddress: "testWalletAddress",
        uuid: "testUuid",
        xmtpID: "testXmtpId",
      } satisfies CachedMessageWithId;

      const persist = vi.fn();
      const updateConversationMetadata = vi.fn();
      await processText({
        client: testClient,
        conversation: testConversation,
        db,
        message: testMessage,
        persist,
        updateConversationMetadata,
        processors: textCacheConfig.processors,
      });
      expect(persist).toHaveBeenCalledWith();
    });

    it("should not process a message with the wrong content type", async () => {
      const testClient = await Client.create(testWallet, { env: "local" });
      const testConversation = {
        id: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        isReady: false,
        topic: "testTopic",
        peerAddress: "testPeerAddress",
        walletAddress: testWallet.address,
      } satisfies CachedConversationWithId;
      const testMessage = {
        id: 1,
        walletAddress: testWallet.address,
        conversationTopic: "testTopic",
        content: {
          filename: "testFilename",
          mimeType: "testMimeType",
          data: new Uint8Array(),
        },
        contentType: ContentTypeAttachment.toString(),
        isSending: false,
        hasSendError: false,
        sentAt: new Date(),
        status: "unprocessed",
        senderAddress: "testWalletAddress",
        uuid: "testUuid",
        xmtpID: "testXmtpId",
      } satisfies CachedMessageWithId<Attachment>;

      const persist = vi.fn();
      const updateConversationMetadata = vi.fn();
      await processText({
        client: testClient,
        conversation: testConversation,
        db,
        message: testMessage,
        persist,
        updateConversationMetadata,
        processors: textCacheConfig.processors,
      });
      expect(persist).not.toHaveBeenCalled();
    });
  });
});
