import {
    CanActivate,
    createParamDecorator,
    ExecutionContext,
    HttpException,
    HttpStatus,
    Injectable
} from "@nestjs/common";
import {TokenService} from "./token.service";
import {findInjectedService} from "./find-injected-service.function";
import {CryptService} from "./crypt.service";


function extractTokenData(request, tokenService: TokenService) {
    const tokenData = tokenService.checkAuthorized<{ tenant: string }>(request)
    if (!tokenData.email)
        throw new HttpException("Could not find tenant on request for token " + tokenService.get(request), HttpStatus.FORBIDDEN);
    return tokenData
}

let tokenService: TokenService
let cryptService: CryptService

export function emailAndRoles(ctx: ExecutionContext) {
    if (!tokenService) {
        tokenService = findInjectedService(TokenService)
    }
    if (!cryptService) {
        cryptService = findInjectedService(CryptService)
    }
    const request = ctx.switchToHttp().getRequest();
    const {email, roles, id} = extractTokenData(request, tokenService);
    return {email, roles, id: cryptService.decode(id)+''};
}

export const UserId = createParamDecorator(
    (data: unknown, ctx: ExecutionContext) => {
        return emailAndRoles(ctx).id;
    },
);

export const Token = createParamDecorator(
    (data: unknown, ctx: ExecutionContext) => {
        return emailAndRoles(ctx);
    },
);


@Injectable()
export class Admin implements CanActivate {
    canActivate(
        ctx: ExecutionContext,
    ): boolean | Promise<boolean> {
        const {roles} = emailAndRoles(ctx);
        return roles.indexOf("ADMIN") >= 0;
    }
}

@Injectable()
export class HasToken implements CanActivate {
    canActivate(
        ctx: ExecutionContext,
    ): boolean | Promise<boolean> {
        const {roles} = emailAndRoles(ctx);
        return roles.length > 0;
    }
}


