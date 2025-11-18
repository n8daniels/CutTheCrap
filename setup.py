"""
Setup script for CutTheCrap RAG Comparison System
"""

from setuptools import setup, find_packages
import os

# Read README for long description
def read_file(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        return f.read()

# Read requirements
def read_requirements(filename):
    with open(filename, 'r') as f:
        return [line.strip() for line in f if line.strip() and not line.startswith('#')]

setup(
    name='cutthe crap-rag-comparison',
    version='1.0.0',
    author='Nate Daniels',
    author_email='your.email@example.com',
    description='RAG System Comparison: Traditional vs MCP-Enhanced',
    long_description=read_file('RAG_COMPARISON_README.md'),
    long_description_content_type='text/markdown',
    url='https://github.com/n8daniels/CutTheCrap',
    packages=find_packages(where='src'),
    package_dir={'': 'src'},
    classifiers=[
        'Development Status :: 4 - Beta',
        'Intended Audience :: Education',
        'Intended Audience :: Developers',
        'Topic :: Scientific/Engineering :: Artificial Intelligence',
        'License :: OSI Approved :: MIT License',
        'Programming Language :: Python :: 3',
        'Programming Language :: Python :: 3.8',
        'Programming Language :: Python :: 3.9',
        'Programming Language :: Python :: 3.10',
        'Programming Language :: Python :: 3.11',
    ],
    python_requires='>=3.8',
    install_requires=read_requirements('requirements.txt'),
    extras_require={
        'dev': [
            'pytest>=7.4.3',
            'pytest-cov>=4.1.0',
            'black>=23.0.0',
            'flake8>=6.0.0',
            'mypy>=1.0.0',
        ],
        'notebook': [
            'jupyter>=1.0.0',
            'ipykernel>=6.25.0',
        ],
        'llm': [
            'openai>=1.6.1',
        ],
    },
    entry_points={
        'console_scripts': [
            'rag-compare=demo.side_by_side_comparison:main',
            'rag-verify=verify_setup:main',
        ],
    },
    include_package_data=True,
    package_data={
        '': ['*.json', '*.md'],
    },
    keywords='rag mcp retrieval-augmented-generation ai ml nlp education',
    project_urls={
        'Bug Reports': 'https://github.com/n8daniels/CutTheCrap/issues',
        'Source': 'https://github.com/n8daniels/CutTheCrap',
        'Documentation': 'https://github.com/n8daniels/CutTheCrap/blob/main/RAG_COMPARISON_README.md',
    },
)
