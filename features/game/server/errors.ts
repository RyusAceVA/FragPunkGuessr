/** Erreur métier portant un statut HTTP, interceptée par les routes API. */
export class GameError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}
