import { Button } from "antd";
import { signIn, signOut, useSession } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";
import { LiaSignOutAltSolid } from "react-icons/lia";

export default function Header() {
  const { data: session, status } = useSession();

  return (
    <div className="md:px-16 rounded-3xl header">
      <div className="flex justify-between items-center p-2">
        <div className="flex items-center text-xl font-bold gradient-text-blue">
          <img src="/logo.png" className="mix-blend-darken w-14 h-14" />
          Servify<span className="hidden md:block"> - Finance manager</span>
        </div>
        {status === "authenticated" ? (
          <div className="flex items-center">
            <img
              src={session?.user?.image}
              alt={session?.user?.name}
              className="w-12 h-12 rounded-xl shadow-lg"
            />
            <Button
              size="large"
              color="danger"
              variant="fill"
              onClick={() => signOut()}
              className="ml-4 border flex items-center font-semibold"
            >
              <LiaSignOutAltSolid />
              Sign out
            </Button>
          </div>
        ) : (
          <>
            <Button
              color="primary"
              variant="fill"
              size="large"
              onClick={() => signIn("google")}
              className="flex items-center font-bold"
            >
              <FcGoogle />
              Sign In
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
