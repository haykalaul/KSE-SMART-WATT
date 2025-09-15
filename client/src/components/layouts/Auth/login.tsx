import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { getBackendURL, getMode } from "../../../lib/readenv";
import axios from "axios";

const postFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type PostFormSchema = z.infer<typeof postFormSchema>;

export default function SignInPage(props: {
  handleLogin: (token: string) => void;
  isAuthenticated: boolean;
}) {
  const backendURL =
    getMode() === "production" ? getBackendURL() : "http://localhost:8080";

  const navigate = useNavigate();

  const [error, setError] = useState("");

  const { register, handleSubmit, formState } = useForm<PostFormSchema>({
    resolver: zodResolver(postFormSchema),
  });

  const onSubmit = handleSubmit(async (data) => {
    const response = await axios.post(`${backendURL}/v1/auth/login`, data, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Cek status respons dan lakukan aksi berdasarkan kondisi
    if (response.data.status) {
      props.handleLogin(response.data.data);
      navigate("/");
    } else {
      setError(response.data.message);
    }
  });

  const handleOAuth = async (server: string) => {
    try {
      const res = await fetch(`${backendURL}/v1/auth/${server}/oauth`, {
        method: "GET",
        credentials: "include",
      });
      const data = await res.json();

      if (res.ok) {
        window.location.href = data.url;
      } else {
        console.error(data.message || "Login failed");
      }
    } catch (err) {
      console.error("Error during OAuth:", err);
    }
  };

  const [searchParams] = useSearchParams();
  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      props.handleLogin(token);
      navigate("/");
    }
  },[searchParams]);

  return props.isAuthenticated ? (
    <Navigate to={"/"} />
  ) : (
    <div
      className="min-h-screen flex after:content-[''] after:block after:absolute after:inset-0 after:bg-black after:bg-opacity-40"
      style={{
        backgroundImage: "url('/background.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="w-[40%] my-20 min-h-96 rounded-xl backdrop-blur bg-white/30 mx-auto z-10 font-inter">
        <div className="p-8">
          <h1 className="text-5xl pb-2 font-bold text-center bg-clip-text text-transparent from-white to-teal-500 bg-gradient-to-r from-20%">
            Sign In
          </h1>
          <form onSubmit={onSubmit} className="mt-4 space-y-4">
            <div className="mb-5">
              <label
                htmlFor="email"
                className="block mb-2 text-sm font-medium text-transparent bg-clip-text bg-gradient-to-r from-white to-teal-400 from-60% w-fit "
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                className="bg-black-50 border text-white  placeholder-zinc-400 text-sm rounded-lg focus:ring-teal-800 focus:border-teal-500 block w-full p-2.5 bg-gray-700 border-teal-500"
                placeholder="aralie@mail.com"
                {...register("email")}
              />
              {formState.errors.email && (
                <p className="mt-2 text-sm text-red-700 ">
                  <span className="font-medium">Oops!</span>{" "}
                  {formState.errors.email?.message?.toString()}
                </p>
              )}
            </div>
            <div className="mb-5">
              <label
                htmlFor="password"
                className="block mb-2 text-sm font-medium text-transparent bg-clip-text bg-gradient-to-r from-white to-teal-400 from-60% w-fit "
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                className="bg-black-50 border text-white  placeholder-zinc-400 text-sm rounded-lg focus:ring-teal-800 focus:border-teal-500 block w-full p-2.5 bg-gray-700 border-teal-500"
                placeholder="********"
                {...register("password")}
              />
              {formState.errors.password && (
                <p className="mt-2 text-sm text-red-700 ">
                  <span className="font-medium">Oops!</span>{" "}
                  {formState.errors.password?.message?.toString()}
                </p>
              )}
              {error && (
                <p className="mt-2 text-sm text-red-700 ">
                  <span className="font-medium">Oops! </span> {error}
                </p>
              )}
            </div>
            <div className="text-center text-white text-sm font-extralight">
              Don't have an account?{" "}
              <Link to={"/register"} className="font-bold text-teal-950">
                Register
              </Link>{" "}
              here.
            </div>
            <button
              type="submit"
              className="w-full mt-5 text-tealBright bg-gradient-to-r from-teal-300 via-lightGray to-tealBright hover:bg-lightGray hover:from-lightGray hover:to-lightGray duration-1000 focus:ring-4 focus:outline-none focus:ring-tealBright shadow-lg shadow-tealBright/80 font-medium rounded-lg text-sm px-5 py-2.5 text-center mb-2"
            >
              Sign In
            </button>
          </form>
          <p className="my-5 text-[0.8rem] font-poppins text-center text-white before:content-['—————'] before:tracking-[-0.15em] before:mr-5 after:content-['—————'] after:tracking-[-0.15em] after:ml-5">
            Or sign in with Google.
          </p>
          <div className="flex gap-6 justify-stretch">
            <button
              onClick={() => handleOAuth("google")}
              type="button"
              className="bg-gradient-to-br from-tealBright via-teal-200 to-tealBright flex justify-center w-full py-2 text-2xl border border-zinc-200 rounded-xl cursor-pointer active:translate-y-0.5 active:shadow-none"
              style={{ boxShadow: "0 3px 3px #00BCCF " }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                x="0px"
                y="0px"
                width="26"
                height="26"
                viewBox="0 0 48 48"
              >
                <path
                  fill="#FFC107"
                  d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
                ></path>
                <path
                  fill="#FF3D00"
                  d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
                ></path>
                <path
                  fill="#4CAF50"
                  d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
                ></path>
                <path
                  fill="#1976D2"
                  d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
                ></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
