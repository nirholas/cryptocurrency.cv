#' Free Crypto News API Client
#'
#' R6 class for interacting with the Free Crypto News API (https://cryptocurrency.cv).
#' No API key required.
#'
#' Inspired by executium/trending-historical-cryptocurrency-news (MIT License).
#'
#' @examples
#' \dontrun{
#' client <- CryptoNews$new()
#'
#' # Latest news
#' articles <- client$get_latest(limit = 10)
#' print(articles[, c("title", "source", "pubDate")])
#'
#' # Search
#' results <- client$search("bitcoin ETF", limit = 5)
#'
#' # DeFi news
#' defi <- client$get_defi(limit = 10)
#' }
#'
#' @export
CryptoNews <- R6::R6Class(
  "CryptoNews",
  public = list(

    #' @field base_url Base URL of the API
    base_url = "https://cryptocurrency.cv",

    #' @description Create a new CryptoNews client
    #' @param base_url Optional custom base URL
    initialize = function(base_url = "https://cryptocurrency.cv") {
      self$base_url <- sub("/$", "", base_url)
    },

    # ── Private helpers ──────────────────────────────────────────

    #' @description Perform a GET request and return parsed JSON
    #' @param path API path, e.g. "/api/news?limit=10"
    fetch = function(path) {
      url <- paste0(self$base_url, path)
      resp <- httr2::request(url) |>
        httr2::req_headers(
          Accept = "application/json",
          `User-Agent` = "free-crypto-news-r-sdk/1.0"
        ) |>
        httr2::req_timeout(30) |>
        httr2::req_perform()
      httr2::resp_body_json(resp, simplifyVector = TRUE)
    },

    # ── Public API ───────────────────────────────────────────────

    #' @description Get latest crypto news from all sources
    #' @param limit Number of articles (1–50, default 10)
    #' @param source Optional source key filter, e.g. "coindesk"
    #' @return data.frame of articles
    get_latest = function(limit = 10, source = NULL) {
      path <- sprintf("/api/news?limit=%d", as.integer(limit))
      if (!is.null(source)) {
        path <- paste0(path, "&source=", utils::URLencode(source, reserved = TRUE))
      }
      private$articles_from(path)
    },

    #' @description Full-text news search
    #' @param keywords Search terms
    #' @param limit Number of results (1–30, default 10)
    #' @return data.frame of articles
    search = function(keywords, limit = 10) {
      path <- sprintf(
        "/api/search?q=%s&limit=%d",
        utils::URLencode(keywords, reserved = TRUE),
        as.integer(limit)
      )
      private$articles_from(path)
    },

    #' @description Get DeFi-specific news
    #' @param limit Number of articles (1–30, default 10)
    #' @return data.frame of articles
    get_defi = function(limit = 10) {
      private$articles_from(sprintf("/api/defi?limit=%d", as.integer(limit)))
    },

    #' @description Get Bitcoin-specific news
    #' @param limit Number of articles (1–30, default 10)
    #' @return data.frame of articles
    get_bitcoin = function(limit = 10) {
      private$articles_from(sprintf("/api/bitcoin?limit=%d", as.integer(limit)))
    },

    #' @description Get breaking news from the last 2 hours
    #' @param limit Number of articles (1–20, default 5)
    #' @return data.frame of articles
    get_breaking = function(limit = 5) {
      private$articles_from(sprintf("/api/breaking?limit=%d", as.integer(limit)))
    },

    #' @description Get list of all news sources
    #' @return data.frame of source metadata
    get_sources = function() {
      resp <- self$fetch("/api/sources")
      as.data.frame(resp$sources)
    }
  ),

  private = list(
    articles_from = function(path) {
      resp <- self$fetch(path)
      as.data.frame(resp$articles)
    }
  )
)
