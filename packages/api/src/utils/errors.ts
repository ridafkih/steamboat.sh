export class BootstrapError extends Error {
  constructor(...parameters: ConstructorParameters<typeof Error>) {
    super(...parameters);
  }
}
