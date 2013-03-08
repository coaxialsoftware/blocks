

desc "Build JS File"
task :default do

	`mkdir -p build`
	`uglifyjs src/blocks.js -o build/blocks-min.js`
	`cat lib/j5g3-all-min.js build/blocks-min.js > build/game.js`
	`zip -j blocks.zip build/game.js src/index.html src/blocks-ss.png src/light.png`

end

desc "Downloads last j5g3 version from github"
task :update do

end
