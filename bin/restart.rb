#!/usr/bin/env ruby
# source: https://github.com/adammck/restartomatic

$pid    = nil
$time   = nil
$paused = false

# todo: better comand-line options
# (use the infinitered skeleton)
if (ARGV.length < 2) or (ARGV.length > 3)
	puts "Usage: restartomatic PATTERN COMMAND [PIDFILE]"
	puts
	puts "Re-run COMMAND every time the contents"
	puts "of files matched by PATTERN change, to"
	puts "avoid pressing [ctrl+c, up, enter]"
	puts
	puts "  Don't forget to quote the arguments, to"
	puts "  prevent them from being expanded by Bash"
	puts
	puts 'Examples: dev "*.rb" "ruby app.rb"'
	puts '          dev "*.py" "python launch.py"'
	exit
end

$pattern,
$command,
$pidfile = *ARGV

if $pidfile
	File.open($pidfile, "w") do |f|
		f.write Process.pid
	end
end


# run COMMAND in its own thread, and
# restart it each time it is killed
Thread.new do
	while true
		if $paused
			sleep 1
			
		else
			$time = Time.now
			$pid = fork do
				exec $command
			end
			
			# wait for COMMAND to end, then mark the
			# pid as nil - so the main thread doesn't
			# try to kill a non-existant process
			Process.wait $pid
			$pid = nil
			
			# if the process failed, pause until
			# the next change is triggered to retry
			$paused = true unless($?.success?)
		end
	end
end

# don't stack dump on INT
trap("INT") do
	exit
end

# when a SIGHUP is received,
# restart COMMAND immediately
trap("HUP") do
	puts "# SIGHUP received"
	Process.kill("INT", $pid) if $pid
	$paused = nil
end

while true	
	if $time
		changed = []
		
		# fetch all *.rb files recursively, iterate, and store every
		# file that is newer than $time (when the worker started)
		`find . -type f -regextype posix-extended -regex "#{$pattern}" -print0`.split("\0").each do |file|
			if $time && (File.mtime(file) > $time)
				changed.push(file)
			end
		end
	
		# if we found any files that have changed since the 
		# last time that a worker process started, kill it
		# (it will be restarted instantly; above)
		unless changed.empty?
			puts "# Change detected in: " + changed.join(", ")
			Process.kill("INT", $pid) if $pid
			$time = $paused = nil
		end
	end
	
	# re-check in
	# two seconds
	sleep 1
end
