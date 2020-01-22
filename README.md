# Blech documentation

Documentation for the Blech embedded programming language.

The documentation consists of a website and various manuals.

The necessary tool chain to build the documentation and the website consists of

* [Hugo](https://gohugo.io/), the static website generator, 
* [Docsy](https://www.docsy.dev/), the Hugo documentation theme, 
* [Asciidoctor](https://asciidoctor.org/), the text processor and publishing toolchain for AsciiDoc to HTML5.

## Installing the tool chain for this repository

On windows we recommend [Chocolatey](https://chocolatey.org/) for the installation of Hugo and Asciidoctor.

For chocolatey we recommend the [non-administrative install](https://chocolatey.org/docs/installation#non-administrative-install).

From time to time run an upgrade.
```
choco upgrade chocolatey
````

#### Install Asciidoctor - the text processor and publishing toolchain

For larger Blech documentation, like the user manual we use AsciiDoc for document markup and Asciidoctor for processing and publishing.

Install the Asciidoctor toolchain. Details can be found in the [Asciidoctor Getting Started documentation](https://asciidoctor.org/docs/user-manual/#getting-started)

On windows, we recommend to install Ruby with Chocolatey.
```
choco install ruby
```
Test it
```
ruby --version
```

After that, we recommend to install the [Asciidoctor Ruby Gem](https://asciidoctor.org/docs/user-manual/#installing-the-asciidoctor-ruby-gem).

```
gem install asciidoctor
```

Test it
```
asciidoctor --version
```

In order to complete the tool chain you will need the Ruby syntax highlighter [{Rouge}](http://rouge.jneen.net/).
```
gem install rouge
```

#### Install Hugo - the static site generator

Install the extended version of Hugo. The extended version is necessary for the Docsy theme. 

Details can be found in the [Hugo Installation documentation](https://gohugo.io/getting-started/installing/)

On windows we recommend to install Hugo with Chocolatey.
```
choco install hugo-extended -confirm
```

Test it
```
hugo version
```
You should see `/extented` behind the version number.
Now you are ready to work with the repository.

## Working with the repository 

The Blech documentation already contains the Docsy theme as a git submodule. For more information see the [Docsy Getting Started Documentation](https://www.docsy.dev/docs/getting-started/). 
Therefore clone in the following way:

```
git clone --recurse-submodules https://github.com/schorg/blech-doc.git
```

#### Install PostCSS as local npm modules inside the repository

You need to install the following npm modules locally to the `/website` directory of the repository. You must have recent version of [NodeJS](https://nodejs.org/) installed on your machine to use `npm`.

```
cd blech-doc/website

npm install -D --save autoprefixer
npm install -D --save postcss-cli
```

#### Update the Docsy theme

From time to time update the Docsy submodule

```
git submodule update --remote
```

#### Generate the manuals with Asciidoctor

From the top of your repository run the `asciidoctor` toolchain for the three - currently draft - manuals

```
asciidoctor -D website/static/asciidoc documentation/blech-user-manual.adoc 
asciidoctor -D website/static/asciidoc documentation/blech-evolution-proposals.adoc 
asciidoctor -D website/static/asciidoc documentation/blechc-development-guide.adoc
```

Find the files `blech-user-manual.html`, `blech-evolution-proposals.html`, and `blechc-development-guide.html` in directory `./website/static/asciidoc`.

If you use Visual Studio Code, you can build the AsciiDoc documentation by running the task `asciidoctor build` defined in `./.vscode/tasks.json`

#### Preview the website

Change to the `./website` subdirectory.
```
cd website
```

Run the website without static site generation
```
hugo serve
```

Open the Blech site preview: http://localhost:1313/blech-doc/

#### Publish the static website content

WARNING: The static website content is preliminary, and therefore currently not deployed.

The static website content is generated into the `/docs` folder of the repository. In order to get a clean content, we recommend to delete the `/docs` folder before creating the content.
From top of the repository run
```
rm -r docs
```

You can create the static website content by running the build-in VSCode tasks. First run the task `asciidoctor build`, after that run the task `hugo build`.

The content can also be generated from the commandline. First generated the static content as with Asciidoctor, as described above.

Then change to subfolder `./website` and generated the static website content using Hugo.

```
cd website
...
hugo
```

The website is deployed as a [GitHub Project Page](https://gohugo.io/hosting-and-deployment/hosting-on-github/#github-project-pages). For simplicity, we deploy the project pages [from the `/docs` folder on the `master` branch](https://gohugo.io/hosting-and-deployment/hosting-on-github/#deployment-of-project-pages-from-docs-folder-on-master-branch)

For publishing just push the content of the `/docs` folder to the master branch.

WARNING: The website content will be deployed soon.

Give GitHub some time to deploy the content and open the Blech site on: 
* http://blech-lang.org or
* https://boschresearch.github.io/blech-doc





