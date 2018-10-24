require 'socket'

@server = TCPServer.new 5000

@headers = [
	'HTTP/1.1 200 OK',
	'Content-Type: application/json; charset=utf-8',
	'Access-Control-Allow-Origin: *',
	'Connection: close',
	'',
	'',
].join("\r\n")

puts @headers

@lock = Mutex.new
@counter = 0
@rnd = Random.new

loop do
	Thread.start(@server.accept) do |socket|
		begin
			socket.gets # returns HTTP request contents

			next_rnd = nil
			@lock.synchronize do
				next_rnd = 0.1 * @rnd.rand(5...200)
			end

			sleep(0.1 * next_rnd) # NOTE: the delay occurs here

			local_counter = nil
			@lock.synchronize do
				local_counter = @counter
				@counter += 1
			end

			socket.print @headers
			socket.puts "{ \"counter\" : \"#{local_counter}\" }"
			STDOUT.puts "< #{local_counter}"

			socket.close
		rescue => e
			STDERR.puts ":( ... #{e}"
		end
	end
end
