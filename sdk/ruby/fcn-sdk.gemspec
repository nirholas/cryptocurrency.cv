# frozen_string_literal: true

Gem::Specification.new do |spec|
  spec.name          = 'fcn-sdk'
  spec.version       = '0.2.0'
  spec.authors       = ['FCN Contributors']
  spec.email         = ['developers@free-crypto-news.com']

  spec.summary       = 'Ruby SDK for Free Crypto News API'
  spec.description   = 'Production-ready Ruby client for the Free Crypto News API. ' \
                       'Features include news aggregation, AI-powered analysis, portfolio tools, ' \
                       'on-chain event correlation, and real-time market data.'
  spec.homepage      = 'https://github.com/WilliamAGH/free-crypto-news'
  spec.license       = 'MIT'

  spec.required_ruby_version = '>= 2.7.0'

  spec.metadata = {
    'bug_tracker_uri'   => 'https://github.com/WilliamAGH/free-crypto-news/issues',
    'changelog_uri'     => 'https://github.com/WilliamAGH/free-crypto-news/blob/main/CHANGELOG.md',
    'documentation_uri' => 'https://cryptocurrency.cv/docs',
    'homepage_uri'      => spec.homepage,
    'source_code_uri'   => 'https://github.com/WilliamAGH/free-crypto-news/tree/main/sdk/ruby',
    'rubygems_mfa_required' => 'true'
  }

  spec.files = Dir['lib/**/*.rb', 'README.md', 'LICENSE', 'CHANGELOG.md']
  spec.require_paths = ['lib']

  # Runtime dependencies
  spec.add_dependency 'json', '>= 2.0'

  # Development dependencies
  spec.add_development_dependency 'minitest', '~> 5.0'
  spec.add_development_dependency 'rake', '~> 13.0'
  spec.add_development_dependency 'rubocop', '~> 1.50'
  spec.add_development_dependency 'webmock', '~> 3.18'
  spec.add_development_dependency 'vcr', '~> 6.1'
  spec.add_development_dependency 'simplecov', '~> 0.22'
  spec.add_development_dependency 'yard', '~> 0.9'
end
