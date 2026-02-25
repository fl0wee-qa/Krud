import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export type RequestUser = {
  id: string;
  email: string;
  role: string;
};

export const CurrentUser = createParamDecorator(
  (_: unknown, context: ExecutionContext): RequestUser | undefined => {
    const request = context.switchToHttp().getRequest();
    return request.user as RequestUser | undefined;
  }
);
