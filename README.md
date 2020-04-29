# Blech documentation

Documentation for the Blech embedded programming language.

The documentation is organised as a website.

The necessary tool chain to build the documentation and the website consists of

* [Hugo](https://gohugo.io/), the static website generator, 
* [Docsy](https://www.docsy.dev/), the Hugo documentation theme, 

## Installing the tool chain for this repository

On windows we recommend [Chocolatey](https://chocolatey.org/) for the installation of Hugo.

For chocolatey we recommend the [non-administrative install](https://chocolatey.org/docs/installation#non-administrative-install).
In a corporate setup behind a proxy use the [corresponding options](https://chocolatey.org/docs/installation#installing-behind-a-proxy).

From time to time run an upgrade.
```
choco upgrade chocolatey
````

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
git clone --recurse-submodules --shallow-submodules https://github.com/boschresearch/blech-doc.git
```

#### Install local npm modules

You need to install the following npm modules locally to the `/website` directory of the repository. You must have a recent version of [NodeJS](https://nodejs.org/) installed on your machine to use `npm`.

`npm` is frequently updated. In order to keep up-to-date run:

```
npm install npm@latest -g
```

To install the necessary npm modules go to the `website` subfolder in your cloned repository.

```
cd blech-doc/website
```

Locally install the npm modules `autoprefixer` and `postcss-cli`.

```
npm install -D autoprefixer
npm install -D postcss-cli
```

#### Update the Docsy theme

The Hugo Docsy theme is frequently updated. From time to time update the Docsy theme submodule.

```
git submodule update --remote
```

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

The static website content is generated into the `/docs` folder of the repository. In order to get a clean content, we recommend to delete the `/docs` folder before creating the content.

From top of the repository run
```
rm -r docs
```

The content can be generated from the commandline.
Change to subfolder `./website/scripts`.
```
cd website/scripts
```
and run 
```
./build.[sh, bat]
```

The website is deployed as a [GitHub Project Page](https://gohugo.io/hosting-and-deployment/hosting-on-github/#github-project-pages). For simplicity, we deploy the project pages [from the `/docs` folder on the `master` branch](https://gohugo.io/hosting-and-deployment/hosting-on-github/#deployment-of-project-pages-from-docs-folder-on-master-branch)

For publishing just push the content of the `/docs` folder to the master branch.


Give GitHub some time to deploy the content and open the Blech site on: 
* https://boschresearch.github.io/blech-doc

and soon on:

* http://blech-lang.org and 
* http://www.blech-lang.org






