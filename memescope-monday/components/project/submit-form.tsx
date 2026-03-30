/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import { useEffect, useId, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"

import { platformType, pricingType } from "@/drizzle/db/schema"
import {
  RiArrowLeftLine,
  RiArrowRightLine,
  RiCheckboxCircleFill,
  RiCheckLine,
  RiCloseCircleLine,
  RiFileCheckLine,
  RiImageAddLine,
  RiInformation2Line,
  RiInformationLine,
  RiListCheck,
  RiLoader4Line,
  RiRocketLine,
} from "@remixicon/react"
import { format } from "date-fns"
import { Tag, TagInput } from "emblor"

import {
  DATE_FORMAT,
  LAUNCH_TYPES,
} from "@/lib/constants"
import { UploadButton } from "@/lib/uploadthing"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { RichTextDisplay, RichTextEditor } from "@/components/ui/rich-text-editor"
import { notifyDiscordLaunch } from "@/app/actions/discord"
import {
  scheduleLaunch,
} from "@/app/actions/launch"
import { getAllCategories, submitProject } from "@/app/actions/projects"

interface ProjectFormData {
  name: string
  ticker: string
  websiteUrl: string
  description: string
  categories: string[]
  techStack: string[]
  platforms: string[]
  pricing: string
  chain: string
  coinType: string
  contractAddress: string
  githubUrl?: string
  twitterUrl?: string
  telegramUrl?: string
  pumpfunUrl?: string
  productImage: string | null
}

interface SubmitProjectFormProps {
  userId: string
}

export function SubmitProjectForm({ userId }: SubmitProjectFormProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<ProjectFormData>({
    name: "",
    ticker: "",
    websiteUrl: "",
    description: "",
    categories: [],
    techStack: [],
    platforms: [],
    pricing: "",
    chain: "solana",
    coinType: "existing",
    contractAddress: "",
    githubUrl: "",
    twitterUrl: "",
    telegramUrl: "",
    pumpfunUrl: "",
    productImage: null,
  })

  const [uploadedLogoUrl, setUploadedLogoUrl] = useState<string | null>(null)

  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [isUploadingProductImage, setIsUploadingProductImage] = useState(false)
  const [isLookingUp, setIsLookingUp] = useState(false)
  const [lookupDone, setLookupDone] = useState(false)

  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  const tagInputId = useId()

  const [techStackTags, setTechStackTags] = useState<Tag[]>([])
  const [activeTechTagIndex, setActiveTechTagIndex] = useState<number | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const lookupContract = async (address: string, chain: string) => {
    if (!address || address.length < 20) return
    setIsLookingUp(true)
    setLookupDone(false)
    try {
      const res = await fetch(
        `/api/coins/lookup?address=${encodeURIComponent(address)}&chain=${chain}`,
      )
      if (!res.ok) {
        setIsLookingUp(false)
        return
      }
      const { result } = await res.json()
      if (!result || (!result.name && !result.ticker)) {
        setIsLookingUp(false)
        return
      }
      setFormData((prev) => ({
        ...prev,
        name: result.name || prev.name,
        ticker: result.ticker || prev.ticker,
        description: result.description || prev.description,
        websiteUrl: result.websiteUrl || prev.websiteUrl,
        twitterUrl: result.twitterUrl || prev.twitterUrl,
        telegramUrl: result.telegramUrl || prev.telegramUrl,
        pumpfunUrl: result.pumpfunUrl || prev.pumpfunUrl,
      }))
      if (result.logoUrl) {
        setUploadedLogoUrl(result.logoUrl)
      }
      setLookupDone(true)
    } catch {
      // silently fail
    } finally {
      setIsLookingUp(false)
    }
  }

  const checkWebsiteUrl = async (url: string) => {
    try {
      const response = await fetch(`/api/projects/check-url?url=${encodeURIComponent(url)}`)
      const data = await response.json()
      return data.exists
    } catch (error) {
      console.error("Error checking website URL:", error)
      return false
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    const tagsFromFormData = formData.techStack.map((tech, index) => ({
      id: `${index}-${tech}`,
      text: tech,
    }))
    if (JSON.stringify(tagsFromFormData) !== JSON.stringify(techStackTags)) {
      setTechStackTags(tagsFromFormData)
    }
  }, [formData.techStack])

  useEffect(() => {
    const techStringArray = techStackTags.map((tag) => tag.text)
    if (JSON.stringify(techStringArray) !== JSON.stringify(formData.techStack)) {
      setFormData((prev) => ({ ...prev, techStack: techStringArray }))
    }
  }, [techStackTags])

  async function fetchCategories() {
    setIsLoadingCategories(true)
    try {
      const data = await getAllCategories()
      setCategories(data)
    } catch (err) {
      console.error("Error fetching categories:", err)
      setError("Failed to load categories")
    } finally {
      setIsLoadingCategories(false)
    }
  }

  const nextStep = () => {
    setError(null)
    if (currentStep === 1) {
      if (
        !formData.name ||
        !formData.ticker ||
        !formData.websiteUrl ||
        !formData.description
      ) {
        setError("Please fill in all required project information.")
        return
      }
      try {
        new URL(formData.websiteUrl)
      } catch {
        setError("Please enter a valid website URL.")
        return
      }
    }

    if (currentStep === 2) {
      if (!formData.pricing) {
        setError("Please select a pricing model.")
        return
      }

      if (formData.categories.length > 3) {
        setError("You can select a maximum of 3 categories.")
        return
      }

      if (formData.techStack.length > 5) {
        setError("You can add a maximum of 5 technologies.")
        return
      }
    }

    setCurrentStep((prev) => Math.min(prev + 1, 3))

    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" })
    }, 0)
  }

  const prevStep = () => {
    setError(null)
    setCurrentStep((prev) => Math.max(prev - 1, 1))
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" })
    }, 0)
  }

  const handleFinalSubmit = async () => {
    if (
      !formData.name ||
      !formData.ticker ||
      !formData.websiteUrl ||
      !formData.description ||
      !formData.pricing
    ) {
      setError(
        "Some required information is missing. Please go back and complete all fields.",
      )
      setIsPending(false)
      return
    }

    const urlExists = await checkWebsiteUrl(formData.websiteUrl)
    if (urlExists) {
      setError("This website URL has already been submitted. Please use a different URL.")
      setIsPending(false)
      return
    }

    setIsPending(true)
    setError(null)

    if (formData.categories.length > 3) {
      setError("You can select a maximum of 3 categories.")
      setIsPending(false)
      return
    }

    if (formData.techStack.length > 5) {
      setError("You can add a maximum of 5 technologies.")
      setIsPending(false)
      return
    }

    try {
      const finalLogoUrl = uploadedLogoUrl || null

      const projectData = {
        name: formData.name,
        ticker: formData.ticker,
        description: formData.description,
        websiteUrl: formData.websiteUrl,
        logoUrl: finalLogoUrl,
        productImage: formData.productImage,
        categories: formData.categories,
        techStack: formData.techStack,
        platforms: formData.platforms,
        pricing: formData.pricing,
        chain: formData.chain,
        coinType: formData.coinType,
        contractAddress: formData.contractAddress || null,
        githubUrl: formData.githubUrl || null,
        twitterUrl: formData.twitterUrl || null,
        telegramUrl: formData.telegramUrl || null,
        pumpfunUrl: formData.pumpfunUrl || null,
      }

      const submissionResult = await submitProject(projectData)

      if (!submissionResult.success || !submissionResult.projectId || !submissionResult.slug) {
        throw new Error(submissionResult.error || "Failed to submit project data.")
      }

      const projectId = submissionResult.projectId
      const projectSlug = submissionResult.slug

      // Auto-schedule for today
      try {
        const todayFormatted = format(new Date(), DATE_FORMAT.API)
        const launchSuccess = await scheduleLaunch(
          projectId,
          todayFormatted,
          LAUNCH_TYPES.FREE,
          userId,
        )

        if (!launchSuccess) {
          console.error(
            `Project ${projectId} created but failed to auto-schedule`,
          )
        }

        try {
          await notifyDiscordLaunch(
            formData.name,
            format(new Date(), DATE_FORMAT.DISPLAY),
            LAUNCH_TYPES.FREE,
            formData.websiteUrl,
            `${process.env.NEXT_PUBLIC_URL || ""}/projects/${projectSlug}`,
          )
        } catch (discordError) {
          console.error("Failed to send Discord notification:", discordError)
        }
      } catch (scheduleError) {
        console.error("Error during auto-scheduling:", scheduleError)
      }

      router.push(`/projects/${projectSlug}`)
    } catch (submissionError: unknown) {
      console.error("Error during final submission:", submissionError)
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "An unexpected error occurred.",
      )
      setIsPending(false)
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    handleFinalSubmit()
  }

  const renderStepper = () => (
    <div className="mb-8 sm:mb-10">
      <div className="container mx-auto max-w-3xl">
        <div className="flex items-center justify-between pt-2 sm:px-4 sm:pt-0">
          {[
            { step: 1, label: "Project Info", icon: RiListCheck },
            {
              step: 2,
              label: "Details",
              shortLabel: "Details",
              icon: RiInformation2Line,
            },
            { step: 3, label: "Review", icon: RiFileCheckLine },
          ].map(({ step, label, shortLabel, icon: Icon }) => (
            <div
              key={`step-${step}`}
              className="relative flex w-[120px] flex-col items-center sm:w-[140px]"
            >
              {step < 2 && (
                <div className="absolute top-5 left-[calc(50%+1.5rem)] -z-10 hidden h-[2px] w-[calc(100%-1rem)] sm:block">
                  <div
                    className={`h-full ${
                      currentStep > step ? "bg-primary" : "bg-muted"
                    } transition-all duration-300`}
                  />
                </div>
              )}

              <div
                className={`relative flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 sm:h-12 sm:w-12 ${
                  currentStep > step
                    ? "bg-primary ring-primary/10 text-white ring-4"
                    : currentStep === step
                      ? "bg-primary ring-primary/20 text-white ring-4"
                      : "bg-muted/50 text-muted-foreground"
                }`}
              >
                {currentStep > step ? (
                  <RiCheckLine className="h-5 w-5 sm:h-6 sm:w-6" />
                ) : (
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                )}

                {currentStep === step && (
                  <span className="border-primary absolute inset-0 animate-pulse rounded-full border-2" />
                )}
              </div>

              <div className="mt-3 w-full text-center sm:mt-4">
                <span
                  className={`mb-0.5 block text-xs font-medium sm:text-sm ${
                    currentStep >= step ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <span className="hidden sm:inline">{label}</span>
                  <span className="inline sm:hidden">{shortLabel || label}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 px-2 sm:mt-6 sm:px-4">
        <div className="bg-muted/50 h-1.5 w-full overflow-hidden rounded-full">
          <div
            className="bg-primary h-full rounded-full transition-all duration-300 ease-out"
            style={{ width: `${((currentStep - 1) / 2) * 100}%` }}
          />
        </div>
      </div>
    </div>
  )

  const handleCheckboxChange = (
    field: "categories" | "platforms",
    value: string,
    checked: boolean,
  ) => {
    setFormData((prev) => {
      const currentValues = prev[field] || []
      if (checked) {
        return { ...prev, [field]: [...currentValues, value] }
      } else {
        return {
          ...prev,
          [field]: currentValues.filter((item) => item !== value),
        }
      }
    })
  }

  const handleRadioChange = (field: "pricing", value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const getCategoryName = (id: string) => categories.find((cat) => cat.id === id)?.name || id
  const getPlatformLabel = (value: string) =>
    Object.entries(platformType)
      .find(([, v]) => v === value)?.[0]
      ?.toLowerCase() || value
  const getPricingLabel = (value: string) =>
    Object.entries(pricingType)
      .find(([, v]) => v === value)?.[0]
      ?.toLowerCase() || value

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="mx-auto max-w-lg space-y-6 py-4">
            <div className="text-center">
              <h2 className="text-foreground text-xl font-bold">Submit a Coin</h2>
              <p className="text-muted-foreground mt-1 text-sm">
                Paste your contract address to auto-fill everything, or skip to fill manually.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="mb-2 block text-sm font-medium">Chain</Label>
                <div className="flex flex-wrap gap-2">
                  {["solana", "base", "bnb", "ethereum"].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, chain: c }))}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                        formData.chain === c
                          ? "bg-primary text-primary-foreground"
                          : "border-border bg-background hover:bg-muted border"
                      }`}
                    >
                      {c === "bnb" ? "BNB" : c.charAt(0).toUpperCase() + c.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="contractAddressStep0" className="mb-2 block text-sm font-medium">
                  Contract Address
                </Label>
                <Input
                  id="contractAddressStep0"
                  name="contractAddress"
                  value={formData.contractAddress}
                  onChange={handleInputChange}
                  placeholder="Paste contract address or token mint..."
                  className="font-mono text-sm"
                />
              </div>

              <Button
                type="button"
                className="w-full"
                size="lg"
                onClick={async () => {
                  if (formData.contractAddress.length >= 20) {
                    await lookupContract(formData.contractAddress, formData.chain)
                  }
                  setCurrentStep(1)
                }}
                disabled={isLookingUp}
              >
                {isLookingUp ? (
                  <>
                    <RiLoader4Line className="mr-2 h-4 w-4 animate-spin" />
                    Looking up token...
                  </>
                ) : formData.contractAddress.length >= 20 ? (
                  <>
                    <RiRocketLine className="mr-2 h-4 w-4" />
                    Autofill & Continue
                  </>
                ) : (
                  <>
                    <RiArrowRightLine className="mr-2 h-4 w-4" />
                    Continue Manually
                  </>
                )}
              </Button>

              {lookupDone && (
                <p className="flex items-center justify-center gap-1 text-sm text-green-600 dark:text-green-400">
                  <RiCheckboxCircleFill className="h-4 w-4" />
                  Token found! Proceeding with auto-filled data...
                </p>
              )}
            </div>
          </div>
        )

      case 1:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="name">
                Project Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="My Awesome Project"
                required
              />
            </div>
            <div>
              <Label htmlFor="ticker">
                Ticker <span className="text-red-500">*</span>
              </Label>
              <Input
                id="ticker"
                name="ticker"
                value={formData.ticker}
                onChange={handleInputChange}
                placeholder="$MYTOKEN"
                required
              />
            </div>
            <div>
              <Label htmlFor="websiteUrl">
                Website URL <span className="text-red-500">*</span>
              </Label>
              <Input
                id="websiteUrl"
                name="websiteUrl"
                type="url"
                value={formData.websiteUrl}
                onChange={handleInputChange}
                placeholder="https://myawesomeproject.com"
                required
              />
            </div>
            <div>
              <Label htmlFor="description">
                Short Description <span className="text-red-500">*</span>
              </Label>
              <RichTextEditor
                content={formData.description}
                onChange={(content) => setFormData((prev) => ({ ...prev, description: content }))}
                placeholder="Describe your project"
                className="max-h-[300px] overflow-y-auto"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="logoUrl">
                Logo (Max 1MB) <span>(Optional)</span>
              </Label>
              <p className="text-muted-foreground text-xs">
                Recommended: 1:1 square image (e.g., 256x256px).
              </p>
              {uploadedLogoUrl ? (
                <div className="bg-muted/30 relative w-fit rounded-md border p-3">
                  <Image
                    src={uploadedLogoUrl}
                    alt="Logo preview"
                    width={64}
                    height={64}
                    className="rounded object-contain"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground absolute top-1 right-1 h-6 w-6"
                    onClick={() => setUploadedLogoUrl(null)}
                    aria-label="Remove logo"
                  >
                    <RiCloseCircleLine className="h-5 w-5" />
                  </Button>
                </div>
              ) : (
                <div className="mt-2 flex items-center gap-2">
                  <UploadButton
                    endpoint="projectLogo"
                    onUploadBegin={() => {
                      console.log("Upload Begin (Logo)")
                      setIsUploadingLogo(true)
                      setError(null)
                    }}
                    onClientUploadComplete={(res) => {
                      console.log("Upload Response (Logo):", res)
                      setIsUploadingLogo(false)
                      if (res && res.length > 0 && res[0].serverData?.fileUrl) {
                        setUploadedLogoUrl(res[0].serverData.fileUrl)
                        console.log("Logo URL set:", res[0].serverData.fileUrl)
                      } else {
                        console.error("Logo upload failed: No URL", res)
                        setError("Logo upload failed: No URL returned.")
                      }
                    }}
                    onUploadError={(error: Error) => {
                      console.error("Upload Error (Logo):", error)
                      setIsUploadingLogo(false)
                      setError(`Logo upload failed: ${error.message}`)
                    }}
                    appearance={{
                      button: `ut-button border border-input bg-background hover:bg-accent hover:text-accent-foreground text-sm h-9 px-3 inline-flex items-center justify-center gap-2 ${isUploadingLogo ? "opacity-50 pointer-events-none" : ""}`,
                      allowedContent: "hidden",
                    }}
                    content={{
                      button({ ready, isUploading }) {
                        if (isUploading) return <RiLoader4Line className="h-4 w-4 animate-spin" />
                        if (ready)
                          return (
                            <>
                              <RiImageAddLine className="h-4 w-4" /> Upload Logo
                            </>
                          )
                        return "Getting ready..."
                      },
                    }}
                  />
                  {isUploadingLogo && (
                    <span className="text-muted-foreground text-xs">Uploading...</span>
                  )}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="productImage">
                Product Image <span>(Optional)</span>
              </Label>
              <p className="text-muted-foreground text-xs">
                Add a product image. Recommended: 16:9 aspect ratio (e.g., 800x450px).
              </p>
              {formData.productImage ? (
                <div className="bg-muted/30 relative w-fit rounded-md border p-3">
                  <Image
                    src={formData.productImage}
                    alt="Product image preview"
                    width={256}
                    height={256}
                    className="rounded object-contain"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground absolute top-1 right-1 h-6 w-6"
                    onClick={() => setFormData((prev) => ({ ...prev, productImage: null }))}
                    aria-label="Remove product image"
                  >
                    <RiCloseCircleLine className="h-5 w-5" />
                  </Button>
                </div>
              ) : (
                <div className="mt-2 flex items-center gap-2">
                  <UploadButton
                    endpoint="projectProductImage"
                    onUploadBegin={() => {
                      console.log("Upload Begin (Product Image)")
                      setIsUploadingProductImage(true)
                      setError(null)
                    }}
                    onClientUploadComplete={(res) => {
                      console.log("Upload Response (Product Image):", res)
                      setIsUploadingProductImage(false)
                      if (res && res.length > 0 && res[0].serverData?.fileUrl) {
                        setFormData((prev) => ({
                          ...prev,
                          productImage: res[0].serverData.fileUrl,
                        }))
                        console.log("Product Image URL set:", res[0].serverData.fileUrl)
                      } else {
                        console.error("Product image upload failed: No URL", res)
                        setError("Product image upload failed: No URL returned.")
                      }
                    }}
                    onUploadError={(error: Error) => {
                      console.error("Upload Error (Product Image):", error)
                      setIsUploadingProductImage(false)
                      setError(`Product image upload failed: ${error.message}`)
                    }}
                    appearance={{
                      button: `ut-button flex items-center w-fit gap-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground text-sm h-9 px-3 ${isUploadingProductImage ? "opacity-50 pointer-events-none" : ""}`,
                      allowedContent: "hidden",
                    }}
                    content={{
                      button({ ready, isUploading }) {
                        if (isUploading) return <RiLoader4Line className="h-4 w-4 animate-spin" />
                        if (ready)
                          return (
                            <>
                              <RiImageAddLine className="h-4 w-4" /> Add Product Image
                            </>
                          )
                        return "Getting ready..."
                      },
                    }}
                  />
                  {isUploadingProductImage && (
                    <span className="text-muted-foreground text-xs">Uploading...</span>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      case 2:
        return (
          <div className="space-y-8">
            <div>
              <Label className="mb-2 block">
                Categories
                <span className="text-muted-foreground ml-2 text-xs">
                  ({formData.categories.length}/3 selected)
                </span>
              </Label>
              {isLoadingCategories ? (
                <div className="text-muted-foreground flex items-center gap-2">
                  <RiLoader4Line className="h-4 w-4 animate-spin" /> Loading...
                </div>
              ) : categories.length > 0 ? (
                <div className="max-h-60 space-y-3 overflow-y-auto rounded-md border p-4">
                  {categories.map((cat) => (
                    <div key={cat.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`cat-${cat.id}`}
                        checked={formData.categories.includes(cat.id)}
                        onCheckedChange={(checked) => {
                          if (checked && formData.categories.length >= 3) {
                            setError("You can select a maximum of 3 categories.")
                            return
                          }
                          handleCheckboxChange("categories", cat.id, !!checked)
                        }}
                      />
                      <Label htmlFor={`cat-${cat.id}`} className="cursor-pointer font-normal">
                        {cat.name}
                      </Label>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No categories available.</p>
              )}
              <p className="text-muted-foreground mt-1 text-xs">
                Select up to 3 relevant categories.
              </p>
            </div>

            <div>
              <Label htmlFor={tagInputId}>
                Tech Stack
                <span className="text-muted-foreground ml-2 text-xs">
                  ({formData.techStack.length}/5 technologies)
                </span>
              </Label>
              <TagInput
                id={tagInputId}
                tags={techStackTags}
                setTags={(newTags) => {
                  if (newTags.length > 5) {
                    setError("You can add a maximum of 5 technologies.")
                    return
                  }
                  setTechStackTags(newTags)
                }}
                placeholder="Type a technology and press Enter..."
                styleClasses={{
                  inlineTagsContainer:
                    "border-input rounded-md bg-background shadow-xs transition-[color,box-shadow] focus-within:border-ring outline-none focus-within:ring-[3px] focus-within:ring-ring/50 p-1 gap-1 mt-1",
                  input: "w-full min-w-[80px] shadow-none px-2 h-7",
                  tag: {
                    body: "h-7 relative bg-background border border-input hover:bg-background rounded-md font-medium text-xs ps-2 pe-7",
                    closeButton:
                      "absolute -inset-y-px -end-px p-0 rounded-e-md flex size-7 transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] text-muted-foreground/80 hover:text-foreground",
                  },
                }}
                activeTagIndex={activeTechTagIndex}
                setActiveTagIndex={setActiveTechTagIndex}
              />
              <p className="text-muted-foreground mt-1 text-xs">
                Enter up to 5 technologies used, press Enter or comma to add a tag.
              </p>
            </div>

            <div>
              <Label className="mb-2 block">
                Platforms
              </Label>
              <div className="space-y-3 rounded-md border p-4">
                {Object.entries(platformType).map(([key, value]) => (
                  <div key={value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`platform-${value}`}
                      checked={formData.platforms.includes(value)}
                      onCheckedChange={(checked) =>
                        handleCheckboxChange("platforms", value, !!checked)
                      }
                    />
                    <Label
                      htmlFor={`platform-${value}`}
                      className="cursor-pointer font-normal capitalize"
                    >
                      {key.toLowerCase()}
                    </Label>
                  </div>
                ))}
              </div>
              <p className="text-muted-foreground mt-1 text-xs">
                Select all platforms your project supports.
              </p>
            </div>

            {!formData.contractAddress && (
              <div>
                <Label className="mb-2 block">Chain</Label>
                <div className="space-y-3 rounded-md border p-4">
                  {(["solana", "base", "bnb", "ethereum"] as const).map((chain) => (
                    <div key={chain} className="flex items-center space-x-2">
                      <Checkbox
                        id={`chain-${chain}`}
                        checked={formData.chain === chain}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData((prev) => ({ ...prev, chain }))
                          }
                        }}
                      />
                      <Label
                        htmlFor={`chain-${chain}`}
                        className="cursor-pointer font-normal capitalize"
                      >
                        {chain}
                      </Label>
                    </div>
                  ))}
                </div>
                <p className="text-muted-foreground mt-1 text-xs">
                  Select the blockchain your coin is on.
                </p>
              </div>
            )}

            <div>
              <Label className="mb-2 block">
                Coin Type <span className="text-red-500">*</span>
              </Label>
              <RadioGroup
                value={formData.coinType}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, coinType: value }))}
                className="flex flex-col gap-4 sm:flex-row"
              >
                {[
                  { key: "existing", label: "Existing" },
                  { key: "upcoming", label: "Upcoming" },
                ].map(({ key, label }) => (
                  <div key={key} className="flex-1">
                    <Label
                      htmlFor={`coinType-${key}`}
                      className="hover:bg-muted/50 flex h-full cursor-pointer items-center space-x-2 rounded-md border p-3 transition-colors"
                    >
                      <RadioGroupItem value={key} id={`coinType-${key}`} />
                      <span className="font-normal">{label}</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div>
              <Label className="mb-2 block">
                Pricing Model <span className="text-red-500">*</span>
              </Label>
              <RadioGroup
                value={formData.pricing}
                onValueChange={(value) => handleRadioChange("pricing", value)}
                className="flex flex-col gap-4 sm:flex-row"
              >
                {Object.entries(pricingType).map(([key, value]) => (
                  <div key={value} className="flex-1">
                    <Label
                      htmlFor={`pricing-${value}`}
                      className="hover:bg-muted/50 flex h-full cursor-pointer items-center space-x-2 rounded-md border p-3 transition-colors"
                    >
                      <RadioGroupItem value={value} id={`pricing-${value}`} />
                      <span className="font-normal capitalize">{key.toLowerCase()}</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <Label htmlFor="githubUrl">GitHub URL (Optional)</Label>
                <Input
                  id="githubUrl"
                  name="githubUrl"
                  type="url"
                  value={formData.githubUrl}
                  onChange={handleInputChange}
                  placeholder="https://github.com/user/repo"
                />
              </div>
              <div>
                <Label htmlFor="twitterUrl">Twitter URL (Optional)</Label>
                <Input
                  id="twitterUrl"
                  name="twitterUrl"
                  type="url"
                  value={formData.twitterUrl}
                  onChange={handleInputChange}
                  placeholder="https://twitter.com/username"
                />
              </div>
              <div>
                <Label htmlFor="telegramUrl">Telegram URL (Optional)</Label>
                <Input
                  id="telegramUrl"
                  name="telegramUrl"
                  type="url"
                  value={formData.telegramUrl}
                  onChange={handleInputChange}
                  placeholder="https://t.me/yourchannel"
                />
              </div>
              <div>
                <Label htmlFor="pumpfunUrl">PumpFun URL (Optional)</Label>
                <Input
                  id="pumpfunUrl"
                  name="pumpfunUrl"
                  type="url"
                  value={formData.pumpfunUrl}
                  onChange={handleInputChange}
                  placeholder="https://pump.fun/coin/..."
                />
              </div>
            </div>
          </div>
        )
      case 3:
        return (
          <div className="space-y-8">
            <div className="flex items-center gap-2">
              <RiCheckLine className="h-5 w-5" />
              <h3 className="text-lg font-medium">Review and Submit</h3>
            </div>

            <div className="bg-card overflow-hidden rounded-lg border">
              <div className="space-y-6 p-6">
                <div>
                  <h4 className="mb-3 border-b pb-2 text-base font-semibold">
                    Project Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <p>
                      <strong>Name:</strong> {formData.name}
                    </p>
                    <p>
                      <strong>Ticker:</strong> {formData.ticker}
                    </p>
                    <p>
                      <strong>Website:</strong>{" "}
                      <a
                        href={formData.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {formData.websiteUrl}
                      </a>
                    </p>
                    <p>
                      <strong>Description:</strong>
                    </p>
                    <RichTextDisplay
                      content={formData.description}
                      className="mt-1 max-h-[200px] overflow-y-auto rounded-md border p-2 text-sm"
                    />
                    {uploadedLogoUrl && (
                      <p className="flex flex-col items-start gap-2">
                        <strong>Logo:</strong>
                        <Image
                          src={uploadedLogoUrl}
                          alt="Uploaded logo"
                          width={48}
                          height={48}
                          className="rounded border"
                        />
                      </p>
                    )}
                    {formData.productImage && (
                      <p className="flex flex-col items-start gap-2">
                        <strong>Product Image:</strong>
                        <Image
                          src={formData.productImage}
                          alt="Product image"
                          width={128}
                          height={128}
                          className="rounded border object-cover"
                        />
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="mb-3 border-b pb-2 text-base font-semibold">Details</h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <strong>Categories:</strong>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {formData.categories.map((catId) => (
                          <Badge key={catId} variant="secondary">
                            {getCategoryName(catId)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <strong>Tech Stack:</strong>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {formData.techStack.map((tech) => (
                          <Badge key={tech} variant="outline">
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <strong>Platforms:</strong>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {formData.platforms.map((plat) => (
                          <Badge key={plat} variant="secondary" className="capitalize">
                            {getPlatformLabel(plat)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <p>
                      <strong>Pricing:</strong>{" "}
                      <span className="capitalize">
                        <Badge variant="outline">{getPricingLabel(formData.pricing)}</Badge>
                      </span>
                    </p>
                    {formData.githubUrl && (
                      <p>
                        <strong>GitHub:</strong>{" "}
                        <a
                          href={formData.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {formData.githubUrl}
                        </a>
                      </p>
                    )}
                    {formData.twitterUrl && (
                      <p>
                        <strong>Twitter:</strong>{" "}
                        <a
                          href={formData.twitterUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {formData.twitterUrl}
                        </a>
                      </p>
                    )}
                    {formData.telegramUrl && (
                      <p>
                        <strong>Telegram:</strong>{" "}
                        <a
                          href={formData.telegramUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {formData.telegramUrl}
                        </a>
                      </p>
                    )}
                    {formData.pumpfunUrl && (
                      <p>
                        <strong>PumpFun:</strong>{" "}
                        <a
                          href={formData.pumpfunUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {formData.pumpfunUrl}
                        </a>
                      </p>
                    )}
                    <p>
                      <strong>Chain:</strong>{" "}
                      <Badge variant="secondary" className="capitalize">
                        {formData.chain}
                      </Badge>
                    </p>
                    <p>
                      <strong>Coin Type:</strong>{" "}
                      <Badge variant="outline" className="capitalize">
                        {formData.coinType}
                      </Badge>
                    </p>
                    {formData.contractAddress && (
                      <p>
                        <strong>Contract Address:</strong>{" "}
                        <span className="font-mono text-xs">{formData.contractAddress}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-muted/30 border-t px-6 py-4">
                <div className="flex items-start gap-3">
                  <RiInformationLine className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-500" />
                  <div className="space-y-1 text-sm">
                    <p className="font-medium">Ready to submit?</p>
                    <p className="text-muted-foreground text-xs">
                      Please review all information carefully. Once submitted, your project will be
                      listed.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {currentStep >= 1 && renderStepper()}

      {renderStepContent()}

      {error && (
        <div className="bg-destructive/10 border-destructive/30 text-destructive rounded-md border p-3 text-sm">
          {error}
        </div>
      )}

      {currentStep >= 1 && <div className="flex items-center justify-between border-t pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            if (currentStep === 1) {
              setCurrentStep(0)
            } else {
              prevStep()
            }
          }}
          disabled={isPending || isUploadingLogo || isUploadingProductImage}
        >
          <RiArrowLeftLine className="mr-2 h-4 w-4" />
          Previous
        </Button>

        {currentStep < 3 ? (
          <Button
            type="button"
            onClick={nextStep}
            disabled={
              isPending ||
              isUploadingLogo ||
              isUploadingProductImage
            }
          >
            Next
            <RiArrowRightLine className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleFinalSubmit}
            disabled={isPending || isUploadingLogo || isUploadingProductImage}
          >
            {isPending ? (
              <RiLoader4Line className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RiRocketLine className="mr-2 h-4 w-4" />
            )}
            Submit Project
          </Button>
        )}
      </div>}
    </form>
  )
}
