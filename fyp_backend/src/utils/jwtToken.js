const sendToken = (user, statusCode, res) => {
  const token = user.getJwtToken();
  const maxAgeMs = 30 * 24 * 60 * 60 * 1000;
  const options = {
    expires: new Date(Date.now() + maxAgeMs),
    maxAge: maxAgeMs,
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };

  res.status(statusCode).cookie("token", token, options).json({
    success: true,
    user,
    token,
  });
};

export default sendToken;
