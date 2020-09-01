# Blech documentation

Documentation for the Blech embedded programming language.
[Read the documentation on our homepage.](https://boschresearch.github.io/blech-doc/)

If you want to change the contents of that website read the following to get started.

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
npm install -D --save autoprefixer
npm install -D --save postcss-cli
```

#### Update the Docsy theme

The Hugo Docsy theme is frequently updated. From time to time update the Docsy theme submodule.

```
git submodule update --init --recursive
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

Open the Blech site preview: http://localhost:1313/

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

* https://blech-lang.org 
* https://www.blech-lang.org
* https://boschresearch.github.io/blech-doc


#### Check for broken links on the website

In order to check the links on the website you can use the npm package [broken link checker](https://github.com/stevenvachon/broken-link-checker).

Install it with

```
npm install broken-link-checker -g
```

Test the installation

```
blc --help
```

Check the whole Blech website with
```
blc https://blech-lang.org -ro
```

The last command only works in a network with commandline DNS access, i.e. without a proxy.

## Creating content

The [documentation for the Docsy Theme](https://www.docsy.dev/docs/adding-content/) explains how to create content.

Creating a blog post is easy. The [Docsy example site shows how to do this](https://example.docsy.dev/blog/2018/10/06/easy-documentation-with-docsy/).

Additional information can be found in the [TechOS theme documentation](https://temp.bep.is/td/docs/theme-documentation/).






