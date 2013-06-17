-- phpMyAdmin SQL Dump
-- version 2.11.9.4
-- http://www.phpmyadmin.net
--
-- Host: 10.0.13.84
-- Generation Time: Jul 20, 2011 at 04:47 AM
-- Server version: 5.0.91
-- PHP Version: 5.2.8

SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";

-- --------------------------------------------------------

--
-- Table structure for table `diagrams`
--

DROP TABLE IF EXISTS `diagrams`;
CREATE TABLE `diagrams` (
  `id` int(11) NOT NULL auto_increment,
  `code` longtext NOT NULL,
  PRIMARY KEY  (`id`)
) ENGINE=MyISAM  DEFAULT CHARSET=utf8 ;
