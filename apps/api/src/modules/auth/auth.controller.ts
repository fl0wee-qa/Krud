import { Body, Controller, Post } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginDto, RefreshDto, RegisterDto } from "./dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @Post("login")
  login(@Body() body: LoginDto) {
    return this.authService.login(body);
  }

  @Post("refresh")
  refresh(@Body() body: RefreshDto) {
    return this.authService.refresh(body);
  }
}
