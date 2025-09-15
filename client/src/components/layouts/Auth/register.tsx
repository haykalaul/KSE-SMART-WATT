import { zodResolver } from "@hookform/resolvers/zod";
import { FormEventHandler, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { z } from "zod";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "../../ui/input-otp";
import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";
import { getBackendURL, getMode } from "../../../lib/readenv";

const postFormSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type PostFormSchema = z.infer<typeof postFormSchema>;

export default function SignUpPage(props: {
  isAuthenticated: boolean;
  handleLogin: (token: string) => void;
}) {
  const backendURL = getMode() === "production" ? getBackendURL() : "http://localhost:8080"

  const navigate = useNavigate();

  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submited, setSubmited] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorOTP, setErrorOTP] = useState("");

  const { register, handleSubmit, formState, watch } = useForm<PostFormSchema>({
    resolver: zodResolver(postFormSchema),
  });

  const onSubmit = handleSubmit(async (data) => {
    if (watch("password") !== confirmPassword) {
      setError("Password and confirm password must be the same");
      return;
    }

    setLoading(true);
    const res = await fetch(`${backendURL}/v1/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }).then((res) => res.json());

    if (res.status) {
      localStorage.setItem("email", res.data.email);
      sendOTP();
    } else {
      setError(res.message);
    }
  });

  const sendOTP = async () => {
    const email = localStorage.getItem("email") || "";
    if (email === "") {
      return;
    }

    const res = await fetch(`${backendURL}/v1/auth/send/otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: email }),
    }).then((res) => res.json());

    if (res.status) {
      setLoading(false);
      setSubmited(true);
    } else {
      setError(res.message);
    }
  };

  const verifyOTP: FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();

    setLoading(true);
    const email = localStorage.getItem("email") || "";
    const code = Array.from(document.querySelectorAll("input")).reduce(
      (acc, input) => acc + input.value,
      ""
    );

    if (email === "") {
      return;
    }

    const res = await fetch(`${backendURL}/v1/auth/verify/otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: email, otp: code }),
    }).then((res) => res.json());

    if (res.status) {
      setLoading(false);
      navigate("/login");
    } else {
      setLoading(false);
      setErrorOTP(res.message);
      setTimeout(() => {
        setErrorOTP("");
      }, 3000);
    }
  };

  return props.isAuthenticated ? (
    <Navigate to={"/"} />
  ) : (
    <div
      className="h-screen flex after:content-[''] after:block after:absolute after:inset-0 after:bg-black after:bg-opacity-40"
      style={{
        backgroundImage: "url('/background.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="w-[45%] my-auto h-fit rounded-xl backdrop-blur bg-white/30 mx-auto z-10 font-inter flex flex-col justify-center">
        <div className="p-8">
          {submited ? (
            <div className="my-8">
              <h1 className="text-4xl pb-2 font-bold text-center bg-clip-text text-transparent from-white to-teal-500 bg-gradient-to-r from-20%">
                Verify Your Email Address
              </h1>
              <h2 className="text-xl text-zinc-300 text-center font-light">
                Please enter the 6-digit code we sent to{" "}
              </h2>
              <h3 className="text-xl text-white text-center font-bold -mt-1">
                {localStorage.getItem("email")}
              </h3>
              <form
                onSubmit={verifyOTP}
                className="mx-auto mt-9 flex flex-col items-center"
              >
                <InputOTP
                  className="flex justify-center"
                  maxLength={6}
                  pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
                >
                  <InputOTPGroup className="flex justify-center">
                    <InputOTPSlot
                      className="h-16 w-16 shadow-none text-white text-3xl"
                      index={0}
                    />
                    <InputOTPSlot
                      className="h-16 w-16 shadow-none text-white text-3xl"
                      index={1}
                    />
                    <InputOTPSlot
                      className="h-16 w-16 shadow-none text-white text-3xl"
                      index={2}
                    />
                    <InputOTPSlot
                      className="h-16 w-16 shadow-none text-white text-3xl"
                      index={3}
                    />
                    <InputOTPSlot
                      className="h-16 w-16 shadow-none text-white text-3xl"
                      index={4}
                    />
                    <InputOTPSlot
                      className="h-16 w-16 shadow-none text-white text-3xl"
                      index={5}
                    />
                  </InputOTPGroup>
                </InputOTP>
                <p
                  id="helper-text-explanation"
                  className="mt-2 text-sm font-light text-white text-center"
                >
                  Did't get OTP Code?{"  "}
                  <button
                    onClick={sendOTP}
                    type="button"
                    className="font-bold text-teal-400 mx-auto"
                  >
                    Send Again
                  </button>
                </p>
                <button
                  type="submit"
                  className="w-full mt-5 text-tealBright bg-gradient-to-r from-teal-300 via-lightGray to-tealBright hover:bg-lightGray hover:from-lightGray hover:to-lightGray duration-1000 focus:ring-4 focus:outline-none focus:ring-tealBright shadow-lg shadow-tealBright/80 font-medium rounded-lg text-sm px-5 py-2.5 text-center mb-2"
                >
                  {loading ? (
                    <div role="status">
                      <svg
                        aria-hidden="true"
                        className="inline w-6 h-6 text-gray-200 animate-spin fill-teal-600"
                        viewBox="0 0 100 101"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                          fill="currentColor"
                        />
                        <path
                          d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                          fill="currentFill"
                        />
                      </svg>
                      <span className="sr-only">Loading...</span>
                    </div>
                  ) : (
                    "Verify"
                  )}
                </button>
                {/* <p className="font-light text-zinc-300 text-sm mt-16 text-center">
                  Want to Change Your Email?
                  <button
                    onClick={() => setSubmited(!submited)}
                    className="font-bold text-white"
                  >
                    {" "}
                    Back to Register
                  </button>
                </p> */}
              </form>
            </div>
          ) : (
            <>
              <h1 className="text-5xl pb-2 font-bold text-center bg-clip-text text-transparent from-white to-teal-500 bg-gradient-to-r from-20%">
                Sign Up
              </h1>
              <form onSubmit={onSubmit} className="mt-4 space-y-4 py-4">
                <div className="mb-5">
                  <label
                    htmlFor="name"
                    className="block mb-2 text-sm font-medium text-transparent bg-clip-text bg-gradient-to-r from-white to-teal-400 from-60% w-fit "
                  >
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    className="bg-black-50 border text-white  placeholder-zinc-400 text-sm rounded-lg focus:ring-teal-800 focus:border-teal-500 block w-full p-2.5 bg-gray-700 border-teal-500"
                    placeholder="Abigail Rachel"
                    {...register("name")}
                  />
                  {formState.errors.name && (
                    <p className="mt-2 text-sm text-red-700 ">
                      <span className="font-medium">Oops!</span>{" "}
                      {formState.errors.name?.message?.toString()}
                    </p>
                  )}
                </div>
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
                </div>
                <div className="mb-5">
                  <label
                    htmlFor="password-confirm"
                    className="block mb-2 text-sm font-medium text-transparent bg-clip-text bg-gradient-to-r from-white to-teal-400 from-60% w-fit "
                  >
                    Confirm Password
                  </label>
                  <input
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    type="password"
                    id="password-confirm"
                    className="bg-black-50 border text-white  placeholder-zinc-400 text-sm rounded-lg focus:ring-teal-800 focus:border-teal-500 block w-full p-2.5 bg-gray-700 border-teal-500"
                    placeholder="********"
                  />
                  {error && (
                    <p className="mt-2 text-sm text-red-700 ">
                      <span className="font-medium">Oops! </span> {error}
                    </p>
                  )}
                </div>
                <div className="text-center text-white text-sm font-extralight">
                  Already have an account?{" "}
                  <Link to={"/login"} className="font-bold text-teal-950">
                    Login
                  </Link>{" "}
                  here.
                </div>
                <button
                  disabled={loading}
                  type="submit"
                  className="w-full mt-5 text-tealBright bg-gradient-to-r from-teal-300 via-lightGray to-tealBright hover:bg-lightGray hover:from-lightGray hover:to-lightGray duration-1000 focus:ring-4 focus:outline-none focus:ring-tealBright shadow-lg shadow-tealBright/80 font-medium rounded-lg text-sm px-5 py-2.5 text-center mb-2"
                >
                  {loading ? (
                    <div role="status">
                      <svg
                        aria-hidden="true"
                        className="inline w-6 h-6 text-gray-200 animate-spin fill-teal-600"
                        viewBox="0 0 100 101"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                          fill="currentColor"
                        />
                        <path
                          d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                          fill="currentFill"
                        />
                      </svg>
                      <span className="sr-only">Loading...</span>
                    </div>
                  ) : (
                    "Sign Up"
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
      {errorOTP && (
        <div
          id="toast-danger"
          className="flex items-center w-full max-w-xs p-4 mb-4 text-gray-500 bg-white rounded-lg shadow fixed bottom-5 right-5 z-10"
          role="alert"
        >
          <div className="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 text-red-500 bg-red-100 rounded-lg">
            <svg
              className="w-5 h-5"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 11.793a1 1 0 1 1-1.414 1.414L10 11.414l-2.293 2.293a1 1 0 0 1-1.414-1.414L8.586 10 6.293 7.707a1 1 0 0 1 1.414-1.414L10 8.586l2.293-2.293a1 1 0 0 1 1.414 1.414L11.414 10l2.293 2.293Z" />
            </svg>
            <span className="sr-only">Error icon</span>
          </div>
          <div className="ms-3 text-sm font-normal">{errorOTP}</div>
          <button
            disabled={loading}
            onClick={() => setErrorOTP("")}
            type="button"
            className="ms-auto -mx-1.5 -my-1.5 bg-white text-gray-400 hover:text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-gray-100 inline-flex items-center justify-center h-8 w-8"
            data-dismiss-target="#toast-danger"
            aria-label="Close"
          >
            <span className="sr-only">Close</span>
            <svg
              className="w-3 h-3"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 14 14"
            >
              <path
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
              />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
