"use client";

import { useState, useCallback, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/Toast";
import { cn } from "@/lib/utils";
import { Send, Loader2, CheckCircle, AlertCircle } from "lucide-react";

const subjects = [
  { value: "general", label: "General Inquiry", icon: "💬" },
  { value: "bug", label: "Bug Report", icon: "🐛" },
  { value: "feature", label: "Feature Request", icon: "💡" },
  { value: "api", label: "API Support", icon: "🔧" },
  { value: "partnership", label: "Partnership", icon: "🤝" },
  { value: "security", label: "Security Issue", icon: "🔒" },
];

type FormState = "idle" | "submitting" | "success" | "error";
type FieldErrors = { name?: string; email?: string; message?: string };

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("general");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [formState, setFormState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const { addToast } = useToast();

  const validateField = useCallback((field: string, value: string): string | undefined => {
    switch (field) {
      case "name":
        if (!value.trim()) return "Name is required";
        if (value.trim().length < 2) return "Name must be at least 2 characters";
        return undefined;
      case "email":
        if (!value.trim()) return "Email is required";
        if (!validateEmail(value)) return "Please enter a valid email address";
        return undefined;
      case "message":
        if (!value.trim()) return "Message is required";
        if (value.trim().length < 10) return "Message must be at least 10 characters";
        return undefined;
      default:
        return undefined;
    }
  }, []);

  const handleBlur = useCallback((field: string, value: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const error = validateField(field, value);
    setFieldErrors((prev) => ({ ...prev, [field]: error }));
  }, [validateField]);

  const isValid = 
    name.trim().length >= 2 && 
    validateEmail(email) && 
    message.trim().length >= 10;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    // Honeypot — if filled, silently "succeed" (it's a bot)
    if (honeypot) {
      setFormState("success");
      return;
    }

    // Validate all fields
    const errors: FieldErrors = {
      name: validateField("name", name),
      email: validateField("email", email),
      message: validateField("message", message),
    };
    setFieldErrors(errors);
    setTouched({ name: true, email: true, message: true });

    if (errors.name || errors.email || errors.message) return;

    setFormState("submitting");
    setErrorMessage("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), subject, message: message.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Something went wrong");
      }

      setFormState("success");
      setName("");
      setEmail("");
      setSubject("general");
      setMessage("");
      setTouched({});
      setFieldErrors({});
      addToast("Message sent successfully! We'll get back to you soon.", "success");
    } catch (err) {
      setFormState("error");
      const msg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setErrorMessage(msg);
      addToast(msg, "error");
    }
  }

  function handleReset() {
    setFormState("idle");
    setErrorMessage("");
  }

  const inputClasses =
    "w-full rounded-lg border bg-(--color-surface) px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all";

  const getInputBorderClass = (field: string) => {
    if (touched[field] && fieldErrors[field as keyof FieldErrors]) {
      return "border-red-500 focus:ring-red-500";
    }
    if (touched[field] && !fieldErrors[field as keyof FieldErrors]) {
      return "border-green-500/50";
    }
    return "border-border";
  };

  // Show success state after submit
  if (formState === "success") {
    return (
      <div className="text-center py-10">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-green-500/10 text-green-500 mb-4">
          <CheckCircle className="h-8 w-8" />
        </div>
        <h3 className="font-bold text-lg mb-2 text-text-primary">
          Message Sent!
        </h3>
        <p className="text-sm text-text-secondary mb-6 max-w-sm mx-auto">
          Thank you for reaching out. We typically respond within 24-48 hours during business days.
        </p>
        <Button variant="outline" onClick={handleReset}>
          Send Another Message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {/* Honeypot — hidden from real users */}
      <div className="absolute -left-[9999px] opacity-0" aria-hidden="true">
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      {/* Error banner */}
      {formState === "error" && (
        <div className="flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <span className="font-medium">Failed to send message.</span> {errorMessage}
          </div>
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label
            htmlFor="contact-name"
            className="block text-sm font-medium text-text-primary mb-1.5"
          >
            Name <span className="text-red-500">*</span>
          </label>
          <input
            id="contact-name"
            type="text"
            required
            placeholder="Your name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (touched.name) {
                setFieldErrors((prev) => ({ ...prev, name: validateField("name", e.target.value) }));
              }
            }}
            onBlur={() => handleBlur("name", name)}
            className={cn(inputClasses, getInputBorderClass("name"))}
            aria-invalid={touched.name && !!fieldErrors.name}
            aria-describedby={fieldErrors.name ? "name-error" : undefined}
          />
          {touched.name && fieldErrors.name && (
            <p id="name-error" className="text-xs text-red-500 mt-1 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> {fieldErrors.name}
            </p>
          )}
        </div>
        <div>
          <label
            htmlFor="contact-email"
            className="block text-sm font-medium text-text-primary mb-1.5"
          >
            Email <span className="text-red-500">*</span>
          </label>
          <input
            id="contact-email"
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (touched.email) {
                setFieldErrors((prev) => ({ ...prev, email: validateField("email", e.target.value) }));
              }
            }}
            onBlur={() => handleBlur("email", email)}
            className={cn(inputClasses, getInputBorderClass("email"))}
            aria-invalid={touched.email && !!fieldErrors.email}
            aria-describedby={fieldErrors.email ? "email-error" : undefined}
          />
          {touched.email && fieldErrors.email && (
            <p id="email-error" className="text-xs text-red-500 mt-1 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> {fieldErrors.email}
            </p>
          )}
        </div>
      </div>

      <div>
        <label
          htmlFor="contact-subject"
          className="block text-sm font-medium text-text-primary mb-1.5"
        >
          Subject
        </label>
        <select
          id="contact-subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className={cn(inputClasses, "appearance-none cursor-pointer border-border")}
        >
          {subjects.map((s) => (
            <option key={s.value} value={s.value}>
              {s.icon} {s.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="contact-message"
          className="block text-sm font-medium text-text-primary mb-1.5"
        >
          Message <span className="text-red-500">*</span>
        </label>
        <textarea
          id="contact-message"
          required
          rows={5}
          placeholder="Tell us what's on your mind — the more detail you provide, the better we can help."
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            if (touched.message) {
              setFieldErrors((prev) => ({ ...prev, message: validateField("message", e.target.value) }));
            }
          }}
          onBlur={() => handleBlur("message", message)}
          className={cn(inputClasses, "resize-y min-h-[120px]", getInputBorderClass("message"))}
          maxLength={5000}
          aria-invalid={touched.message && !!fieldErrors.message}
          aria-describedby="message-meta"
        />
        <div id="message-meta" className="flex justify-between mt-1">
          {touched.message && fieldErrors.message ? (
            <p className="text-xs text-red-500 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> {fieldErrors.message}
            </p>
          ) : (
            <span />
          )}
          <p className={cn(
            "text-xs",
            message.length > 4500 ? "text-amber-500" : "text-text-tertiary"
          )}>
            {message.length.toLocaleString()}/5,000
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 pt-1">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={!isValid || formState === "submitting"}
        >
          {formState === "submitting" ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending…
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Send Message
            </span>
          )}
        </Button>
        <p className="text-xs text-text-tertiary hidden md:block">
          Typically responds in 24-48 hrs
        </p>
      </div>
    </form>
  );
}
