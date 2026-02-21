# Free Crypto News — R SDK Example
# https://cryptocurrency.cv | No API key required
#
# Install dependencies:
#   install.packages(c("httr2", "jsonlite", "R6"))

library(R6)
source("R/crypto_news.R")

client <- CryptoNews$new()

cat("=== Latest Crypto News ===\n")
articles <- client$get_latest(limit = 5)
print(articles[, c("title", "source")])

cat("\n=== Bitcoin News ===\n")
btc <- client$get_bitcoin(limit = 3)
print(btc[, c("title", "source")])

cat("\n=== Search: ethereum ===\n")
results <- client$search("ethereum", limit = 3)
print(results[, c("title", "source")])
