#!/usr/bin/env ruby

#
# This script manages mappings between branch names and their ports.
# Run it without arguments to print usage.
#

require 'optparse'
require 'json'

startPort = 11001
increment = 10

mode = ''
mappingfile = ''
branchname = ''

if ARGV.length == 2 && ARGV[0] == 'get-all' \
|| ARGV.length == 2 && ARGV[0] == 'remove-all' \
|| ARGV.length == 3 && ARGV[0] == 'get-existing' \
|| ARGV.length == 3 && ARGV[0] == 'get-or-create'
	mode = ARGV[0]
	mappingfile = ARGV[1]

	if ARGV.length == 3
		branchname = ARGV[2]
	end
end

if mode == ''
	abort("Following arguments are recognized:\n\n" \
		+ "1) <this-script> get-all       <mapping-file>\n" \
		+ "     --  returns the file contents\n" \
		+ "2) <this-script> remove-all    <mapping-file>\n" \
		+ "     --  returns the file contents\n" \
		+ "3) <this-script> get-existing  <mapping-file> <branch-name>\n" \
		+ "     --  returns existing port for the given branch, or '' if none is mapped\n" \
		+ "4) <this-script> get-or-create <mapping-file> <branch-name>\n" \
		+ "     --  returns existing or newly-created port for the given branch\n")
end

File.open("docker-mapping.json", File::RDWR | File::CREAT) { |f|
	STDERR.puts "Locking file..."

	f.flock(File::LOCK_EX)

	STDERR.puts "File locked!"

	raw = f.read
	data = JSON.parse(raw)

	STDERR.puts "Using mode '#{mode}'"

	if mode == 'get-all'
		puts JSON.pretty_generate(data)
	elsif mode == 'get-existing'
		existing = ''

		for item in data
			item.each do |key, value|
				if key == branchname
					existing = value
					break
				end
			end
		end

		puts existing
	elsif mode == 'remove-all'
		f.rewind
		f.truncate(0)
		f.write(JSON.pretty_generate([]))
	elsif mode == 'get-or-create'
		existing = ''
		highestValue = startPort

		for item in data
			item.each do |key, value|
				if key == branchname
					existing = value.to_i
				end
				if value.to_i > highestValue
					highestValue = value.to_i
				end
			end
		end

		if existing != ''
			puts existing
		else
			newPort = highestValue + increment
			keyval = { branchname => newPort }
			data << keyval

			f.rewind
			f.truncate(0)
			f.write(JSON.pretty_generate(data))

			puts newPort
		end
	end
}

STDERR.puts "Done!"
