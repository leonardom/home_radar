export type AccessTokenPayload = {
  sub: string;
  email: string;
  jti: string;
  type: "access";
  iat?: number;
  exp?: number;
};

declare module "fastify" {
  interface FastifyRequest {
    authUser?: AccessTokenPayload;
  }
}
