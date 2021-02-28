$LOAD_PATH.unshift File.expand_path(File.join(File.dirname(__FILE__), 'lib'))

if ENV['RACK_ENV'] == 'development'
  puts 'Loading as Development'

  require 'logger'
  logger = Logger.new($stdout)

  require 'loyalty_wallet'
  run LoyaltyWallet
else
  require 'loyalty_wallet'
  run LoyaltyWallet.freeze
end
