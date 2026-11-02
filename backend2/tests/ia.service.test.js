import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { post } = vi.hoisted(() => ({ post: vi.fn() }));

vi.mock('axios', () => ({
  default: {
    create: () => ({ post }),
  },
}));

import iaService from '../src/services/ia.service.js';

describe('IAService conversations', () => {
  beforeEach(() => {
    post.mockReset();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends conversation context to the responsive primary AI endpoint', async () => {
    post.mockResolvedValueOnce({
      data: { answer: 'Réponse IA', used_llm: true },
    });
    const context = { quoteNumber: 'DJ-TEST', appliances: [{ name: 'Lampe' }] };

    const result = await iaService.postConversation({ message: '  Ma question  ', context });

    expect(post).toHaveBeenCalledWith('/demo/kit-console/chat', { message: 'Ma question', context });
    expect(result).toMatchObject({ assistant_message: 'Réponse IA', used_ai: true });
  });

  it('includes kit telemetry in the provider prompt for kit-scoped conversations', async () => {
    post.mockResolvedValueOnce({
      data: { answer: 'La batterie est à surveiller.', used_llm: true },
    });
    const context = {
      scope: 'kit_status',
      kit: { kitId: 'KIT-TEST', batteryChargePercent: 12, alerts: ['Batterie faible'] },
    };

    await iaService.postConversation({ message: 'Fais le point sur mon kit.', context });

    expect(post).toHaveBeenCalledWith('/demo/kit-console/chat', {
      message: expect.stringContaining('"batteryChargePercent":12'),
      context,
    });
    expect(post.mock.calls[0][1].message).toContain('"Batterie faible"');
  });

  it('uses the secondary endpoint when the primary endpoint fails', async () => {
    post
      .mockRejectedValueOnce(new Error('Primary endpoint unavailable'))
      .mockResolvedValueOnce({
        data: { assistant_message: 'Réponse IA secondaire', used_ai: true },
      });

    const result = await iaService.postConversation({ message: 'Question', context: { scope: 'devis' } });

    expect(post).toHaveBeenNthCalledWith(2, '/ai/chat', {
      message: 'Question',
      context: { scope: 'devis' },
    });
    expect(result).toMatchObject({ assistant_message: 'Réponse IA secondaire', used_ai: true });
  });

  it('does not present an error response or non-AI fallback as a successful answer', async () => {
    post
      .mockResolvedValueOnce({ data: { answer: 'Réponse de secours', used_llm: false } })
      .mockResolvedValueOnce({ data: { error: 'Provider unavailable' } });

    await expect(iaService.postConversation({ message: 'Question' })).rejects.toMatchObject({ status: 503 });
    expect(post).toHaveBeenCalledTimes(2);
  });
});
