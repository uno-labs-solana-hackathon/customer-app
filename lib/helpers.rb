module Helpers
  class NotFoundError < StandardError; def backtrace; []; end; end

  def show_not_found
    fail NotFoundError.new('404')
  end

  def details(var_name)
    if var_value = instance_variable_get("@#{var_name}")
      "<details><summary>debug on <code>#{var_name}</code></summary>#{var_value.ai(:html => true)}</details>"
    end
  end

  def page_description
    @page_description
  end

  def site_title
    ENV['SITE_TITLE'] || 'Loyalty Wallet'
  end

  def page_title
    [site_title, @path_parts].flatten.compact.join(' :: ')
  end

  def start_timer
    @start = Process.clock_gettime(Process::CLOCK_MONOTONIC)
  end

  def stop_timer
    Process.clock_gettime(Process::CLOCK_MONOTONIC) - @start
  end

  ERROR_STATUS_MAP = {
    NotFoundError => 404,
  }

  def error_http_status(error)
    ERROR_STATUS_MAP[error.class] || 500
  end
end
