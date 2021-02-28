require 'roda'
require 'helpers'

class LoyaltyWallet < Roda
  include Helpers

  plugin :slash_path_empty
  plugin :render, :engine => 'slim'
  plugin :static, ['/img', '/css', '/js', '/favicon.ico', '/favicon.png', '/robots.txt']
  plugin :error_handler do |error|
    response.status = error_http_status(error)
    message = error.message
    if ENV['RACK_ENV'] == 'developmecnt'
      error.backtrace.each{ |source| message << "\n" << source }
    end
    case @_error_content_type
    when 'text/plain'
      message
    when 'application/json'
      { :success => false, :message => message }
    else
      view :error, :locals => { :error => error }
    end
  end
  plugin :not_found do
    show_not_found
  end

  route do |r|
    start_timer

    r.root do
      options = { :locals => { :solana_light_core_js => "/js/solana-light-wallet-core-0/SolCoreLightWalletCoreWasm.js" } }

      view :'sol/view', options
    end
  end
end
