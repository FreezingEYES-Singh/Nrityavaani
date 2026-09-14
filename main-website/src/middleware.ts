import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/auth/login",
  },
});

export const config = {
  matcher: [
    "/live/:path*",
    "/library/:path*",
    "/practice/:path*",
    "/checkout/:path*",
    "/dashboard/:path*",
  ],
};
