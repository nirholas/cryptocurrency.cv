export function DisclaimerCard() {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/20">
      <p className="text-sm leading-relaxed">
        <span className="font-semibold text-red-600 dark:text-red-400">Disclaimer:</span>{" "}
        <span className="text-red-700 dark:text-red-300">
          This listing is community-submitted and not an endorsement. Safety scores are algorithmic
          estimates. Memecoins are extremely volatile. Always DYOR.
        </span>
      </p>
    </div>
  )
}
