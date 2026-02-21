import { z } from "zod";

export const validateSignUpSchema = z.object({
  fullname: z.string().min(3, {
    message: "Full name must be at least 3 characters long",
  }),
  email: z.email({ message: "Email is required" }),
  password: z
    .string()
    .min(8, {
      message: "Password must be at least 8 characters long",
    })
    .regex(/[A-Z]/, {
      message: "Password must contain at least one uppercase letter",
    })
    .regex(/[a-z]/, {
      message: "Password must contain at least one lowercase letter",
    })
    .regex(/[0-9]/, {
      message: "password must contain at least one number",
    })
    .regex(/[!@#$%^&*(),.?":{}|<>]/, {
      message: "Password must contain at least one special character",
    }),
  role: z.enum(["admin", "applicant"]).optional(),
});

export const validateSignInSchema = z.object({
  email: z.email({ message: "Email is required" }),
  password: z
    .string()
    .min(8, {
      message: "Password must be at least 8 characters long",
    })
    .regex(/[A-Z]/, {
      message: "Password must contain at least one uppercase letter",
    })
    .regex(/[a-z]/, {
      message: "Password must contain at least one lowercase letter",
    })
    .regex(/[0-9]/, {
      message: "password must contain at least one number",
    })
    .regex(/[!@#$%^&*(),.?":{}|<>]/, {
      message: "Password must contain at least one special character",
    }),
});

export const validateAccountSchema = z.object({
  verificationToken: z
    .string()
    .min(6, {
      message: "Token must be 6 digits",
    })
    .max(6, {
      message: "Token must not exceed 6 digits",
    }),
});

export const forgotPasswordSchema = z.object({
  email: z.email({
    message: "Email is required",
  }),
});

export const validateResetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, {
      message: "Password must be at least 8 characters long",
    })
    .regex(/[A-Z]/, {
      message: "Password must contain at least one uppercase letter",
    })
    .regex(/[a-z]/, {
      message: "Password must contain at least one lowercase letter",
    })
    .regex(/[!@#$%^&*(),.?":{}|<>]/, {
      message: "Password must contain at least one special character",
    }),
  confirmPassword: z
    .string()
    .min(8, {
      message: "Password must be at least 8 characters long",
    })
    .regex(/[A-Z]/, {
      message: "Password must contain at least one uppercase letter",
    })
    .regex(/[a-z]/, {
      message: "Password must contain at least one lowercase letter",
    })
    .regex(/[!@#$%^&*(),.?":{}|<>]/, {
      message: "Password must contain at least one special character",
    }),
});

export const updatePasswordSchema = z.object({
  password: z
    .string()
    .min(8, {
      message: "Password must be at least 8 characters long",
    })
    .regex(/[A-Z]/, {
      message: "Password must contain at least one uppercase letter",
    })
    .regex(/[a-z]/, {
      message: "Password must contain at least one lowercase letter",
    })
    .regex(/[!@#$%^&*(),.?":{}|<>]/, {
      message: "Password must contain at least one special character",
    }),
  newPassword: z
    .string()
    .min(8, {
      message: "New Password must be at least 8 characters long",
    })
    .regex(/[A-Z]/, {
      message: "New Password must contain at least one uppercase letter",
    })
    .regex(/[a-z]/, {
      message: "New Password must contain at least one lowercase letter",
    })
    .regex(/[!@#$%^&*(),.?":{}|<>]/, {
      message: "New Password must contain at least one special character",
    }),
  confirmPassword: z
    .string()
    .min(8, {
      message: "Confirm Password must be at least 8 characters long",
    })
    .regex(/[A-Z]/, {
      message: "Confirm Password must contain at least one uppercase letter",
    })
    .regex(/[a-z]/, {
      message: "Confirm Password must contain at least one lowercase letter",
    })
    .regex(/[!@#$%^&*(),.?":{}|<>]/, {
      message: "Confirm Password must contain at least one special character",
    }),
});

export const validateUserSchema = z.object({
  fullname: z
    .string()
    .min(3, {
      message: "Full name must be at least 3 characters long",
    })
    .optional(),
  email: z.string().email().optional(),
  phone: z
    .string()
    .min(10, {
      message: "Phone number must be at least 10 characters long",
    })
    .optional(),
  dateOfBirth: z.string().optional(),
    country: z.string().optional(),
  bio: z.string().max(1000).optional(),
});

// export const contactFormSchema = z.object({
//   fullName: z.string().min(2, "Full name is required"),
//   email: z.email("Valid email is required"),
//   subject: z.string().min(3, "Subject is required"),
//   message: z.string().min(10, "Message must be at least 10 characters"),
// });
export const validateAdminProfile = z.object({
  fullname: z.string().min(3, {
    message: "Full name must be at least 3 characters long",
  }),
  email: z.string().email(),
});
