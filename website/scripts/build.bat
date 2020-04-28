@echo "Building website for production"
@cd ..
@set HUGO_ENV=production
@start /WAIT /B hugo
@cd scripts