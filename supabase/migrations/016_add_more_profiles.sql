-- Add seven more diverse profiles
INSERT INTO people (
    name,
    email,
    title,
    company,
    summary,
    detailed_summary,
    image_url,
    last_contact,
    intros_sought,
    reasons_to_introduce
) VALUES
(
    'Maya Patel',
    'maya.patel@aihealth.co',
    'Chief Technology Officer',
    'AI Health Solutions',
    'Healthcare AI expert focused on improving patient outcomes through machine learning. Previously led ML teams at major healthcare companies.',
    E'Leading technology at AI Health Solutions, where we''re developing AI systems to assist medical professionals in diagnosis and treatment planning. Previously led the machine learning division at HealthTech Global, where I oversaw the development of algorithms that improved diagnostic accuracy by 40%.\n\nI hold a PhD in Computer Science from Stanford with a focus on medical imaging AI, and have published extensively in top ML conferences. My work combines deep technical expertise with a strong understanding of healthcare industry needs.\n\nPassionate about mentoring women in tech and healthcare technology innovation. Regular speaker at healthcare AI conferences and active in various medical technology communities.',
    '/placeholder-avatar.svg',
    '2024-03-10',
    E'I''m particularly interested in connecting with:\n- Healthcare industry executives and decision-makers who are looking to implement AI solutions\n- Medical researchers interested in AI applications\n- Technical leaders in healthcare startups\n- VCs focused on healthtech investments',
    E'I can offer insights and assistance in:\n- AI/ML strategy in healthcare\n- Technical due diligence for healthtech investments\n- Building and scaling technical teams in regulated environments\n- Navigating FDA approval processes for AI/ML systems'
),
(
    'James Wilson',
    'jwilson@sustainablefin.com',
    'Managing Partner',
    'Sustainable Finance Partners',
    'Impact investor focused on climate tech and sustainable infrastructure. 15+ years of experience in renewable energy finance.',
    E'Leading Sustainable Finance Partners'' investment strategy in climate technology and sustainable infrastructure. Managing a $500M fund focused on scaling proven climate solutions. Previously led clean energy investments at Global Infrastructure Partners.\n\nServed as CFO of a major solar energy company that went public in 2019. Deep expertise in project finance, particularly in renewable energy and sustainable infrastructure projects.\n\nBoard member of several climate tech startups and advisor to multiple climate-focused accelerators. Regular contributor to discussions on climate finance and sustainable investing.',
    '/placeholder-avatar.svg',
    '2024-03-05',
    E'Looking to connect with:\n- Founders building scalable climate solutions\n- Other climate tech investors for co-investment opportunities\n- Industry experts in carbon markets and climate policy\n- Corporate sustainability leaders',
    E'Happy to help with:\n- Climate tech investment strategy and fundraising\n- Scaling climate solutions and go-to-market strategy\n- Introductions to our network of climate tech investors\n- Understanding carbon markets and climate regulations'
),
(
    'Dr. Rachel Chen',
    'rachel.chen@quantumtech.io',
    'Quantum Computing Researcher',
    'Quantum Technologies Institute',
    'Leading quantum computing researcher specializing in quantum error correction and fault-tolerant quantum computation.',
    E'Principal Investigator at Quantum Technologies Institute, leading a team of researchers in developing practical quantum error correction protocols. Previously worked at IBM''s quantum computing division.\n\nPhD from MIT in Quantum Computing, with breakthrough contributions to surface code implementations. Author of over 30 peer-reviewed papers in top physics journals.\n\nCurrently focused on making quantum computing practical for real-world applications, particularly in cryptography and materials science. Leading several international collaborations with major quantum computing centers.',
    '/placeholder-avatar.svg',
    '2024-02-28',
    E'Seeking connections with:\n- Other quantum computing researchers and engineers\n- Industry partners interested in quantum applications\n- Quantum hardware manufacturers\n- Technical leaders in cryptography and security',
    E'Can provide expertise in:\n- Quantum computing technology assessment\n- Research collaboration opportunities\n- Technical consulting on quantum implementations\n- Academic and industry partnership development'
),
(
    'Alex Rivera',
    'arivera@scaleup.vc',
    'Principal',
    'ScaleUp Ventures',
    'Early-stage investor focused on B2B SaaS and developer tools. Former software engineer turned VC.',
    E'Leading B2B software investments at ScaleUp Ventures, with a particular focus on developer tools, API-first businesses, and enterprise automation. Previously founded and sold a developer tools startup to GitHub.\n\nPrior to VC, spent 8 years as a software engineer and engineering manager at major tech companies. This technical background helps in deeply understanding and evaluating technical startups.\n\nActive mentor at several tech accelerators and regular speaker on topics like technical founder transition to CEO, early-stage fundraising, and product-led growth.',
    '/placeholder-avatar.svg',
    '2024-03-15',
    E'Interested in meeting:\n- Technical founders building developer tools\n- Enterprise SaaS founders at seed stage\n- Other technical VCs for deal flow sharing\n- Developer communities and evangelists',
    E'Can assist with:\n- Technical due diligence and architecture review\n- Go-to-market strategy for developer tools\n- Fundraising strategy and pitch preparation\n- Hiring and scaling technical teams'
),
(
    'Sarah O''Connor',
    'soconnor@bioventures.com',
    'Biotech Entrepreneur',
    'BioPharma Ventures',
    'Serial biotech entrepreneur with multiple successful exits. Expert in drug discovery and development.',
    E'Founder and CEO of BioPharma Ventures, developing novel therapeutics using AI-driven drug discovery platforms. Previously founded GeneTech Solutions (acquired by Pfizer) and led R&D at major pharmaceutical companies.\n\nPhD in Molecular Biology from Harvard, with 20+ patents in drug discovery methods. Pioneered the use of machine learning in identifying drug candidates.\n\nPassionate about advancing women''s leadership in biotech and improving access to innovative therapeutics. Regular speaker at biotech conferences and active board member of several biotech startups.',
    '/placeholder-avatar.svg',
    '2024-03-01',
    E'Looking to connect with:\n- Biotech researchers and scientists\n- Healthcare investors and VCs\n- AI/ML experts in drug discovery\n- Pharmaceutical industry executives',
    E'Can provide guidance on:\n- Biotech startup strategy and fundraising\n- Drug development and clinical trials\n- IP strategy and patent portfolio development\n- Regulatory navigation and FDA approval process'
),
(
    'Michael Chang',
    'mchang@cybersec.ai',
    'Security Architect',
    'CyberSec AI',
    'Cybersecurity expert specializing in AI-powered threat detection. Previously led security at major tech companies.',
    E'Leading security architecture at CyberSec AI, where we''re building next-generation security systems using machine learning. Previously headed security engineering at major cloud providers and financial institutions.\n\nSpecialized in building scalable security systems that process billions of events daily. Pioneer in applying machine learning to threat detection and response.\n\nActive contributor to major open-source security projects and regular speaker at security conferences like BlackHat and DEFCON.',
    '/placeholder-avatar.svg',
    '2024-03-12',
    E'Seeking to connect with:\n- Security engineers and researchers\n- CTOs and CISOs\n- AI/ML experts interested in security\n- Security startup founders',
    E'Can help with:\n- Security architecture review and design\n- Threat modeling and risk assessment\n- Building security teams and culture\n- Security strategy for startups'
),
(
    'Emma Thompson',
    'emma@sustainablefashion.co',
    'Founder & CEO',
    'Sustainable Fashion Collective',
    'Sustainable fashion entrepreneur focused on circular economy. Pioneer in eco-friendly textile innovation.',
    E'Founded Sustainable Fashion Collective to revolutionize the fashion industry through sustainable practices and circular economy principles. Previously led sustainability initiatives at major fashion brands.\n\nDeveloped patented processes for recycling textile waste into new fabrics. Built a network of over 200 sustainable fashion brands and manufacturers.\n\nFeatured in Vogue, Forbes, and other major publications for contributions to sustainable fashion. Regular speaker on sustainability and fashion technology.',
    '/placeholder-avatar.svg',
    '2024-03-08',
    E'Looking to connect with:\n- Sustainable material scientists and researchers\n- Fashion industry executives\n- Impact investors and VCs\n- Circular economy experts',
    E'Can provide insights on:\n- Sustainable supply chain development\n- Eco-friendly manufacturing processes\n- Scaling sustainable fashion brands\n- Circular economy implementation'
); 